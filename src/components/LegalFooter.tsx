const cdnBase = "https://my.ex-markets.pro";

const legalFooterLinks = [
  { label: "客户协议", href: `${cdnBase}/cdn/media/exnesssc/exness_sc_client_agreement.pdf` },
  { label: "《一般业务条款》", href: `${cdnBase}/cdn/media/exnesssc/exness_sc_general_business_terms.pdf` },
  { label: "合作伙伴协议", href: `${cdnBase}/cdn/media/exnesssc/exness_sc_partnership_agreement.pdf` },
  { label: "奖励条款和条件", href: `${cdnBase}/cdn/media/exnesssc/exness_sc_bonus_terms_and_conditions.pdf` },
  { label: "保密政策", href: `${cdnBase}/cdn/media/exnesssc/confidentiality_policy.pdf` },
  { label: "关键事实声明", href: `${cdnBase}/cdn/media/docs/key_facts_statement.pdf` },
  { label: "利益冲突政策", href: `${cdnBase}/cdn/media/docs/summary_of_conflicts_of_interest_policy.pdf` },
  { label: "隐私协议", href: `${cdnBase}/cdn/media/docs/privacy_agreement.pdf` },
  { label: "风险披露", href: `${cdnBase}/cdn/media/docs/risk_disclosure_and_warning_notice.pdf` },
  { label: "防止洗钱", href: `${cdnBase}/cdn/media/docs/preventing_money_laundering.pdf` },
  { label: "申诉处理政策", href: `${cdnBase}/cdn/media/exnesssc/exness_sc_complaints_procedure_for_clients.pdf` },
  { label: "联系我们", href: "mailto:info@exness.com" },
] as const;

const learnMoreHref = `${cdnBase}/cdn/media/docs/risk_disclosure_and_warning_notice.pdf`;

export function LegalFooter({ variant = "app" }: { variant?: "app" | "login" }) {
  return (
    <footer className={`legal-footer-panel ${variant === "login" ? "legal-footer-panel--login" : ""}`}>
      <div className="legal-footer-copy">
        <p>
          Exness (SC) LTD 是一家注册于塞舌尔的证券经纪商，注册编号为 8423606-1。Exness (SC) LTD 持有金融服务管理局 (Financial
          Services Authority/FSA) 监管牌照，牌照编号为 SD025，注册办公地址为：9A CT House, 2nd floor, Providence, Mahe,
          Seychelles (塞舌尔)。
        </p>
        <p>
          只有在获得 Exness 明确书面同意的情况下，才可复制本网站信息。一般风险警告：差价合约 (CFD) 是杠杆产品。差价合约交易存在较高风险，因此可能不适合所有投资者。投资价值既可能增加也可能减少，投资者可能损失其所有投资资金。在任何情况下，本公司对任何个人或实体的、由与差价合约相关的交易造成的、或因其产生的、或与其关联的全部或部分损失或损害，概不承担任何责任。
          <a className="legal-footer-inline-link" href={learnMoreHref} rel="noopener noreferrer" target="_blank">
            了解更多
          </a>
        </p>
        <p>
          Exness符合支付卡行业数据安全标准 (PCI DSS)，为您的安全和隐私提供保障。我们依照PCI DSS的要求，对我们的商业模型定期进行漏洞扫描和渗透测试。
        </p>
      </div>
      <nav className="legal-footer-links" aria-label="Legal links">
        {legalFooterLinks.map((link) => (
          <a
            key={link.label}
            className="legal-footer-link"
            data-test="footer-link"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.label}
          </a>
        ))}
        <div className="legal-footer-copyright">© 2008 - 2026. Exness</div>
      </nav>
    </footer>
  );
}
