from __future__ import annotations

from decimal import Decimal, InvalidOperation
from pathlib import Path
import sys
from typing import Any


ZERO = Decimal("0")
ONE = Decimal("1")
PROBABILITY_BASIS = Decimal("10000")


class ConfigError(ValueError):
    """Raised when the simplified YAML configuration is invalid."""


def configure_utf8_stdio() -> None:
    """Keep Chinese output readable in Windows terminals and redirected logs."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            reconfigure(encoding="utf-8")


def _strip_comment(line: str) -> str:
    quote: str | None = None
    escaped = False
    for index, char in enumerate(line):
        if escaped:
            escaped = False
            continue
        if char == "\\" and quote:
            escaped = True
            continue
        if char in ("'", '"'):
            if quote is None:
                quote = char
            elif quote == char:
                quote = None
            continue
        if char == "#" and quote is None:
            return line[:index]
    return line


def _split_inline_list(body: str) -> list[str]:
    result: list[str] = []
    current: list[str] = []
    quote: str | None = None
    escaped = False
    for char in body:
        if escaped:
            current.append(char)
            escaped = False
            continue
        if char == "\\" and quote:
            current.append(char)
            escaped = True
            continue
        if char in ("'", '"'):
            current.append(char)
            if quote is None:
                quote = char
            elif quote == char:
                quote = None
            continue
        if char == "," and quote is None:
            result.append("".join(current).strip())
            current = []
        else:
            current.append(char)
    result.append("".join(current).strip())
    if any(not item for item in result):
        raise ConfigError("内联数组中存在空元素")
    return result


def _parse_scalar(token: str) -> Any:
    token = token.strip()
    if not token:
        return ""
    if len(token) >= 2 and token[0] == token[-1] and token[0] in ("'", '"'):
        return token[1:-1]
    lowered = token.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if lowered in ("null", "none", "~"):
        return None
    if token.endswith("%"):
        return token
    try:
        return Decimal(token)
    except InvalidOperation:
        return token


def load_simple_yaml(path: str | Path) -> dict[str, Any]:
    """
    Load the flat YAML subset used by these tools.

    Supported forms:
      key: value
      key: [value1, value2]
      key:
        - value1
        - value2

    Nested mappings are intentionally unsupported so the scripts remain
    dependency-free and the configuration stays easy to audit.
    """
    config_path = Path(path)
    if not config_path.is_file():
        raise ConfigError(f"配置文件不存在：{config_path}")

    data: dict[str, Any] = {}
    active_list_key: str | None = None
    text = config_path.read_text(encoding="utf-8-sig")

    for line_number, original_line in enumerate(text.splitlines(), start=1):
        no_comment = _strip_comment(original_line).rstrip()
        if not no_comment.strip():
            continue
        stripped = no_comment.strip()

        if stripped.startswith("-"):
            if active_list_key is None:
                raise ConfigError(f"第{line_number}行出现了没有所属字段的列表项")
            value_text = stripped[1:].strip()
            if not value_text:
                raise ConfigError(f"第{line_number}行列表项不能为空")
            data[active_list_key].append(_parse_scalar(value_text))
            continue

        active_list_key = None
        if ":" not in stripped:
            raise ConfigError(f"第{line_number}行格式错误，应为 key: value")
        key, value_text = stripped.split(":", 1)
        key = key.strip()
        value_text = value_text.strip()
        if not key:
            raise ConfigError(f"第{line_number}行字段名不能为空")
        if key in data:
            raise ConfigError(f"第{line_number}行字段重复：{key}")

        if not value_text:
            data[key] = []
            active_list_key = key
        elif value_text.startswith("[") and value_text.endswith("]"):
            body = value_text[1:-1].strip()
            data[key] = [] if not body else [
                _parse_scalar(item) for item in _split_inline_list(body)
            ]
        else:
            data[key] = _parse_scalar(value_text)

    return data


def require_key(config: dict[str, Any], key: str) -> Any:
    if key not in config:
        raise ConfigError(f"缺少必填配置：{key}")
    return config[key]


def to_decimal(value: Any, field_name: str) -> Decimal:
    if isinstance(value, bool) or value is None:
        raise ConfigError(f"{field_name}必须是数字")
    try:
        result = value if isinstance(value, Decimal) else Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        raise ConfigError(f"{field_name}不是有效数字：{value}") from None
    if not result.is_finite():
        raise ConfigError(f"{field_name}必须是有限数字")
    return result


def parse_rate(value: Any, field_name: str) -> Decimal:
    """Parse 0.6, 60, or '60%' as the decimal rate 0.6."""
    if isinstance(value, str) and value.strip().endswith("%"):
        number = to_decimal(value.strip()[:-1], field_name) / Decimal("100")
    else:
        number = to_decimal(value, field_name)
        if number > ONE:
            number /= Decimal("100")
    if number < ZERO or number > ONE:
        raise ConfigError(f"{field_name}必须在0%到100%之间")
    return number


def parse_values(config: dict[str, Any]) -> list[Decimal]:
    raw_values = require_key(config, "values")
    if not isinstance(raw_values, list) or not raw_values:
        raise ConfigError("values必须是非空数组")
    values = [to_decimal(value, f"values[{index}]") for index, value in enumerate(raw_values)]
    if any(value < ZERO for value in values):
        raise ConfigError("values中的价值不能为负数")
    return values


def parse_probabilities(config: dict[str, Any], expected_length: int) -> list[Decimal]:
    raw_probabilities = require_key(config, "probabilities")
    if not isinstance(raw_probabilities, list) or not raw_probabilities:
        raise ConfigError("probabilities必须是非空数组")
    if len(raw_probabilities) != expected_length:
        raise ConfigError(
            f"values与probabilities长度不一致：{expected_length} != {len(raw_probabilities)}"
        )
    probabilities = [
        parse_rate(value, f"probabilities[{index}]")
        for index, value in enumerate(raw_probabilities)
    ]
    for index, probability in enumerate(probabilities):
        probability_units = probability * PROBABILITY_BASIS
        if probability_units != probability_units.to_integral_value():
            raise ConfigError(
                f"probabilities[{index}]必须使用万分位精度，"
                "小数概率最多4位、百分比概率最多2位"
            )
    total = sum(probabilities, ZERO)
    if total != ONE:
        raise ConfigError(f"概率合计必须为100%，当前为{format_percent(total)}")
    return probabilities


def format_number(value: Decimal, max_places: int = 8) -> str:
    if value == ZERO:
        return "0"
    quantizer = Decimal("1").scaleb(-max_places)
    rounded = value.quantize(quantizer)
    text = format(rounded, "f").rstrip("0").rstrip(".")
    return text or "0"


def format_percent(value: Decimal, max_places: int = 6) -> str:
    return f"{format_number(value * Decimal('100'), max_places)}%"


def print_table(headers: list[str], rows: list[list[str]]) -> None:
    widths = [len(header) for header in headers]
    for row in rows:
        for index, cell in enumerate(row):
            widths[index] = max(widths[index], len(cell))

    def render(row: list[str]) -> str:
        return " | ".join(cell.ljust(widths[index]) for index, cell in enumerate(row))

    print(render(headers))
    print("-+-".join("-" * width for width in widths))
    for row in rows:
        print(render(row))
