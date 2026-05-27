import { useState } from "react";

export type PostSubmitAnswers = {
  accountPurpose: string;
  hasIncome: string;
  liquidAssets: string;
  annualIncome: string;
};

const TOTAL_STEPS = 5;

type StepDef = {
  stepNum: number;
  title: string;
  hint?: string;
  options: string[];
  key: keyof PostSubmitAnswers;
};

const STEPS: StepDef[] = [
  {
    stepNum: 2,
    title: "您开立账户的目的是什么？",
    options: ["投资", "对冲", "投机"],
    key: "accountPurpose",
  },
  {
    stepNum: 3,
    title: "您目前有收入来源吗？",
    hint: "您可以返回修改您的就业状态",
    options: ["是，我有收入来源", "否，我没有收入来源"],
    key: "hasIncome",
  },
  {
    stepNum: 4,
    title: "您的总流动资产大约是多少？",
    hint: "包括现金、银行存款和流动资产",
    options: [
      "250,001 - 500,000美元",
      "100,001 - 250,000美元",
      "50,001 - 100,000美元",
      "50,000美元以下",
    ],
    key: "liquidAssets",
  },
  {
    stepNum: 5,
    title: "您的年净收入是多少？",
    hint: "包括税后和各项减免后的年度收入",
    options: [
      "250,001 - 500,000美元",
      "100,001 - 250,000美元",
      "50,001 - 100,000美元",
      "50,000美元以下",
    ],
    key: "annualIncome",
  },
];

type Props = {
  onFinish: () => void;
  /** 第 2 步点返回时回到 1/5 个人资料页 */
  onBackToProfile?: () => void;
  initialIndex?: number;
};

export function KycPostSubmitSteps({ onFinish, onBackToProfile, initialIndex = 0 }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<PostSubmitAnswers>({
    accountPurpose: "投资",
    hasIncome: "是，我有收入来源",
    liquidAssets: "250,001 - 500,000美元",
    annualIncome: "250,001 - 500,000美元",
  });

  const current = STEPS[index];
  const selected = answers[current.key];

  function goBack() {
    if (index === 0) {
      onBackToProfile?.();
      return;
    }
    setIndex((i) => i - 1);
  }

  function goNext() {
    if (index >= STEPS.length - 1) {
      onFinish();
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="profile-questionnaire">
      <p className="profile-questionnaire-step">
        {current.stepNum}/{TOTAL_STEPS}
      </p>
      <h3 className="profile-questionnaire-title">{current.title}</h3>
      {current.hint ? <p className="profile-questionnaire-hint">{current.hint}</p> : null}

      <div className="profile-questionnaire-options" role="radiogroup" aria-label={current.title}>
        {current.options.map((option) => (
          <label
            key={option}
            className={`profile-questionnaire-option${selected === option ? " is-selected" : ""}`}
          >
            <input
              type="radio"
              name={current.key}
              value={option}
              checked={selected === option}
              onChange={() => setAnswers((prev) => ({ ...prev, [current.key]: option }))}
            />
            <span className="profile-questionnaire-radio" aria-hidden="true" />
            <span>{option}</span>
          </label>
        ))}
      </div>

      <div className="profile-questionnaire-actions">
        {index > 0 || onBackToProfile ? (
          <button type="button" className="profile-btn-secondary" onClick={goBack}>
            返回
          </button>
        ) : (
          <span className="profile-questionnaire-actions-spacer" />
        )}
        <button type="button" className="profile-btn-primary" onClick={goNext}>
          {index >= STEPS.length - 1 ? "完成" : "继续"}
        </button>
      </div>
    </div>
  );
}
