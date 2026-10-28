package com.ruoyi.sano.finance.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 提现记录对象 sano_wallet_withdraw
 * 
 * @author xiashikai
 * @date 2025-12-04
 */
@Data
public class SanoWalletWithdraw extends BaseEntity{
    private static final long serialVersionUID = 1L;

    /** 流水号 */
    @JsonSerialize(using = ToStringSerializer.class)
    private Long orderNo;

    /** 上游订单号 */
    @Excel(name = "上游订单号")
    private String tradeNo;

    /** 渠道类型：1 官方（谷歌，苹果），2  三方渠道，3 payroll */
    @Excel(name = "渠道类型：1 官方,2  三方渠道，3 payroll")
    private Integer producerType;

    /** 提现渠道编码 */
    @Excel(name = "提现渠道编码")
    private String producerCode;

    /** 提现方式编码 */
    @Excel(name = "提现方式编码")
    private String channelCode;

    /** 用户ID */
    @Excel(name = "用户ID")
    private Long userId;

    private String userCode;

    /** 扣除钻石*1000 */
    @Excel(name = "扣除钻石*1000")
    private Long diamond;

    /** 扣除前钻石*1000 */
    @Excel(name = "扣除前钻石*1000")
    private Long diamondOld;

    /** 扣除后钻石*1000 */
    @Excel(name = "扣除后钻石*1000")
    private Long diamondNew;

    /** 提现金额（美金） */
    @Excel(name = "提现金额")
    private BigDecimal moneyDollar;

    /** 实际到账金额（美金） */
    @Excel(name = "实际到账金额")
    private BigDecimal realityMoney;

    /** 固定手续费（美金） */
    @Excel(name = "固定手续费")
    private BigDecimal serviceFixedMoney;

    /** 手续费费率 */
    @Excel(name = "手续费费率")
    private BigDecimal serviceFloatRate;

    /** 手续费金额（美金） */
    @Excel(name = "手续费金额")
    private BigDecimal serviceFloatMoney;

    /** 用户提现渠道ID */
    @Excel(name = "用户提现渠道ID")
    private Long userWithdrawChannelId;

    /** 打款货币图标 */
    @Excel(name = "打款货币图标")
    private String currencyIcon;

    /** 打款货币代码 */
    @Excel(name = "打款货币代码")
    private String currencyCode;

    /** 打款货币汇率 */
    @Excel(name = "打款货币汇率")
    private BigDecimal rate;

    /** 实际打款金额（对应货币） */
    @Excel(name = "实际打款金额")
    private BigDecimal money;

    /** 提现状态：1 待审核，2 驳回（已退款），3 打款中，4 打款成功，5 打款失败，6 已退款 */
    @Excel(name = "提现状态：1 待审核，2 驳回")
    private Integer status;

    /** 国家代码 */
    @Excel(name = "国家代码")
    private String countryCode;

    /** 国旗方 */
    @Excel(name = "国旗方")
    private String countryFlagSquare;

    /** 国旗圆 */
    @Excel(name = "国旗圆")
    private String countryFlagRound;

    /** 打款时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "打款时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date payTime;

    /** 驳回原因 */
    @Excel(name = "驳回原因")
    private String rejectReason;

    /** 审核人 */
    @Excel(name = "审核人")
    private Long auditUser;

    /** 审核时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Excel(name = "审核时间", width = 30, dateFormat = "yyyy-MM-dd HH:mm:ss")
    private Date auditTime;

    /** 备注 */
    @Excel(name = "备注")
    private String remarks;

    /*
     * 以下字段来自 sano_user_withdraw_channel 关联查询，不属于提现主表。
     * 用于管理端列表、详情和导出展示提现申请时的收款渠道快照。
     */

    /** 收款账号 */
    @Excel(name = "账户")
    private String accountNo;

    /** 账户类型 */
    @Excel(name = "账户类型")
    private String accountType;

    /** 账户验证数字 */
    @Excel(name = "账户验证数字")
    private String checkDigit;

    /** 银行代码 */
    @Excel(name = "银行代码")
    private String bankCode;

    /** 银行名称 */
    @Excel(name = "银行名称")
    private String bankName;

    /** 银行网点号 */
    @Excel(name = "银行网点号")
    private String bankBranch;

    /** 银行城市 */
    @Excel(name = "银行城市")
    private String bankCity;

    /** 银行代理账号 */
    @Excel(name = "银行代理账号")
    private String corAccountNo;

    /** 名 */
    @Excel(name = "名")
    private String firstName;

    /** 中间名 */
    @Excel(name = "中间名")
    private String middleName;

    /** 姓 */
    @Excel(name = "姓")
    private String lastName;

    /** 全名 */
    @Excel(name = "全名")
    private String fullName;

    /** 证明类型 */
    @Excel(name = "证明类型")
    private String documentType;

    /** 个人识别号码 */
    @Excel(name = "个人识别号码")
    private String documentId;

    /** 识别号码生效日期 */
    @Excel(name = "识别号码生效日期")
    private String documentIssueDate;

    /** 识别号码失效日期 */
    @Excel(name = "识别号码失效日期")
    private String documentExpireDate;

    /** 地址 */
    @Excel(name = "地址")
    private String address;

    /** 城市 */
    @Excel(name = "城市")
    private String city;

    /** 州 */
    @Excel(name = "州")
    private String state;

    /** 邮编 */
    @Excel(name = "邮编")
    private String zipCode;

    /** 电话号码 */
    @Excel(name = "电话")
    private String payeePhone;

    /** 出生日期 */
    @Excel(name = "出生日期")
    private String birthDate;

    /** USDT地址 */
    @Excel(name = "USDT地址")
    private String usdtAddress;

    /** 币安ID */
    @Excel(name = "币安ID")
    private String binanceId;

    /** 邮箱 */
    @Excel(name = "email")
    private String email;

}
