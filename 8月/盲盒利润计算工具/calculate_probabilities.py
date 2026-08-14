from __future__ import annotations

import argparse
import math
import sys
from decimal import Decimal, ROUND_FLOOR

from blind_box_common import (
    ConfigError,
    ONE,
    ZERO,
    configure_utf8_stdio,
    format_number,
    format_percent,
    load_simple_yaml,
    parse_rate,
    parse_values,
    print_table,
    require_key,
    to_decimal,
)


PROBABILITY_BASIS = 10_000
PROBABILITY_PLACES = 4


def _round_probabilities_to_basis(probabilities: list[Decimal]) -> list[Decimal]:
    """Convert probabilities to integer ten-thousandths while keeping the sum at 100%."""
    total = sum(probabilities, ZERO)
    if total <= ZERO:
        raise ConfigError("概率合计必须大于0")

    basis = Decimal(PROBABILITY_BASIS)
    normalized = [probability / total for probability in probabilities]
    scaled = [probability * basis for probability in normalized]
    units = [int(value.to_integral_value(rounding=ROUND_FLOOR)) for value in scaled]
    remaining_units = PROBABILITY_BASIS - sum(units)

    # 最大余数法补齐剩余份数，可确保总数严格为10000，并尽量减小取整误差。
    order = sorted(
        range(len(units)),
        key=lambda index: (scaled[index] - Decimal(units[index]), -index),
        reverse=True,
    )
    for index in order[:remaining_units]:
        units[index] += 1

    return [Decimal(unit) / basis for unit in units]


def _weighted_mean(normalized_values: list[float], coefficient: float) -> tuple[float, list[float]]:
    arguments = [coefficient * value for value in normalized_values]
    maximum = max(arguments)
    weights = [math.exp(argument - maximum) for argument in arguments]
    total = sum(weights)
    probabilities = [weight / total for weight in weights]
    mean = sum(value * probability for value, probability in zip(normalized_values, probabilities))
    return mean, probabilities


def maximum_entropy_probabilities(values: list[Decimal], target_mean: Decimal) -> list[Decimal]:
    """Return the unique maximum-entropy distribution with the requested mean."""
    minimum = min(values)
    maximum = max(values)
    tolerance = Decimal("0.0000000001") * max(ONE, abs(maximum))
    if target_mean < minimum - tolerance or target_mean > maximum + tolerance:
        raise ConfigError(
            f"目标期望价值{format_number(target_mean)}不在价值范围"
            f"[{format_number(minimum)}, {format_number(maximum)}]内"
        )

    if maximum == minimum:
        return _round_probabilities_to_basis(
            [ONE / Decimal(len(values)) for _ in values]
        )

    if abs(target_mean - minimum) <= tolerance:
        indexes = [index for index, value in enumerate(values) if value == minimum]
        result = [ZERO for _ in values]
        share = ONE / Decimal(len(indexes))
        for index in indexes:
            result[index] = share
        return _round_probabilities_to_basis(result)
    if abs(target_mean - maximum) <= tolerance:
        indexes = [index for index, value in enumerate(values) if value == maximum]
        result = [ZERO for _ in values]
        share = ONE / Decimal(len(indexes))
        for index in indexes:
            result[index] = share
        return _round_probabilities_to_basis(result)

    span = maximum - minimum
    normalized_values = [float((value - minimum) / span) for value in values]
    normalized_target = float((target_mean - minimum) / span)

    low = -1.0
    high = 1.0
    low_mean, _ = _weighted_mean(normalized_values, low)
    high_mean, _ = _weighted_mean(normalized_values, high)
    while low_mean > normalized_target:
        low *= 2.0
        low_mean, _ = _weighted_mean(normalized_values, low)
        if low < -4096:
            break
    while high_mean < normalized_target:
        high *= 2.0
        high_mean, _ = _weighted_mean(normalized_values, high)
        if high > 4096:
            break

    probabilities_float: list[float] = []
    for _ in range(200):
        middle = (low + high) / 2.0
        middle_mean, probabilities_float = _weighted_mean(normalized_values, middle)
        if middle_mean < normalized_target:
            low = middle
        else:
            high = middle

    return _round_probabilities_to_basis(
        [Decimal(str(value)) for value in probabilities_float]
    )


def calculate(config_path: str) -> None:
    config = load_simple_yaml(config_path)
    price = to_decimal(require_key(config, "gift_price"), "gift_price")
    if price <= ZERO:
        raise ConfigError("gift_price必须大于0")
    values = parse_values(config)
    if len(values) < 2:
        raise ConfigError("values至少需要两个价值，否则无法按期望值计算概率")

    target_return_rate = parse_rate(
        require_key(config, "value_return_rate"),
        "value_return_rate",
    )
    target_expected_value = price * target_return_rate
    probabilities = maximum_entropy_probabilities(values, target_expected_value)
    achieved_expected_value = sum(
        (value * probability for value, probability in zip(values, probabilities)),
        ZERO,
    )
    achieved_return_rate = achieved_expected_value / price

    print(f"礼物单价：{format_number(price)}")
    print(f"目标价值返奖率：{format_percent(target_return_rate)}")
    print(f"目标期望价值：{format_number(target_expected_value)}")
    print("概率求解方法：最大熵分布，按10000概率基数取整")
    print()

    rows: list[list[str]] = []
    for value, probability in zip(values, probabilities):
        rows.append(
            [
                format_number(value),
                format_number(probability, PROBABILITY_PLACES),
                format_percent(probability, 2),
                format_number(value * probability),
            ]
        )
    print_table(["价值", "概率小数", "概率百分比", "期望贡献"], rows)
    print()
    print("可复制到分析配置：")
    probability_array = ", ".join(format_number(value, PROBABILITY_PLACES) for value in probabilities)
    print(f"probabilities: [{probability_array}]")
    print()
    print(f"概率合计：{format_percent(sum(probabilities, ZERO), 2)}")
    print(f"生成概率的实际期望价值：{format_number(achieved_expected_value)}")
    print(f"生成概率的实际价值返奖率：{format_percent(achieved_return_rate, 8)}")
    print()
    print("说明：仅凭价值数组和价值返奖率无法得到唯一概率数组，本脚本先使用最大熵原则生成唯一解，")
    print("再按万分位精度取整并保证概率合计为100%；实际返奖率可能与目标存在微小偏差。")


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="根据目标价值返奖率计算盲盒概率数组")
    parser.add_argument("config", help="YAML配置文件路径")
    args = parser.parse_args()
    try:
        calculate(args.config)
    except ConfigError as error:
        print(f"配置错误：{error}", file=sys.stderr)
        return 2
    except OSError as error:
        print(f"文件错误：{error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
