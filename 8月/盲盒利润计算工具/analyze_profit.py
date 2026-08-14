from __future__ import annotations

import argparse
import sys
from decimal import Decimal

from blind_box_common import (
    ConfigError,
    ZERO,
    configure_utf8_stdio,
    format_number,
    format_percent,
    load_simple_yaml,
    parse_probabilities,
    parse_values,
    print_table,
    require_key,
    to_decimal,
)


RECIPIENT_SHARE = Decimal("0.70")
HOST_SHARE = Decimal("0.02")
GUILD_SHARE = Decimal("0.20")


def analyze(config_path: str) -> None:
    config = load_simple_yaml(config_path)
    price = to_decimal(require_key(config, "gift_price"), "gift_price")
    if price <= ZERO:
        raise ConfigError("gift_price必须大于0")

    values = parse_values(config)
    probabilities = parse_probabilities(config, len(values))
    expected_value = sum(
        (value * probability for value, probability in zip(values, probabilities)),
        ZERO,
    )

    recipient_income = expected_value * RECIPIENT_SHARE
    host_income = price * HOST_SHARE

    scenarios = [
        ("赠送他人", "无公会", recipient_income, ZERO),
        ("赠送他人", "有公会(20%)", recipient_income, recipient_income * GUILD_SHARE),
        ("自己玩", "无公会", expected_value + host_income, ZERO),
        ("自己玩", "有公会(20%)", expected_value + host_income, host_income * GUILD_SHARE),
    ]

    print(f"礼物单价：{format_number(price)}")
    print(f"概率合计：{format_percent(sum(probabilities, ZERO))}")
    print(f"盲盒期望价值：{format_number(expected_value)}")
    print(f"价值返奖率：{format_percent(expected_value / price)}")
    print()

    detail_rows: list[list[str]] = []
    for value, probability in zip(values, probabilities):
        detail_rows.append(
            [
                format_number(value),
                format_percent(probability),
                format_number(value * probability),
            ]
        )
    print("价值期望明细")
    print_table(["价值", "概率", "期望贡献"], detail_rows)
    print()

    summary_rows: list[list[str]] = []
    for play_type, guild_status, base_payout, guild_payout in scenarios:
        total_payout = base_payout + guild_payout
        profit = price - total_payout
        profit_rate = profit / price
        summary_rows.append(
            [
                play_type,
                guild_status,
                format_number(base_payout),
                format_number(guild_payout),
                format_number(total_payout),
                format_number(profit),
                format_percent(profit_rate),
            ]
        )

    print("两种玩法、有公会/无公会汇总")
    print_table(
        ["玩法", "公会情况", "用户/主播支出", "公会支出", "平台总支出", "平台利润", "利润率"],
        summary_rows,
    )
    print()
    print("说明：结果为长期理论期望，未执行平台实际的逐笔最小单位取整。")


def main() -> int:
    configure_utf8_stdio()
    parser = argparse.ArgumentParser(description="根据盲盒价值及概率分析两种玩法的利润率")
    parser.add_argument("config", help="YAML配置文件路径")
    args = parser.parse_args()
    try:
        analyze(args.config)
    except ConfigError as error:
        print(f"配置错误：{error}", file=sys.stderr)
        return 2
    except OSError as error:
        print(f"文件错误：{error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
