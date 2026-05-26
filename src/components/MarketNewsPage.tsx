import { useMemo, useState, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { usePA } from "../state/paStore";
import { translateText } from "../i18n";
import type { MarketNewsItem } from "../types";
import {
  formatMarketNewsDate,
  formatMarketNewsTag,
  filterMarketNews,
  marketNewsFilterTags,
  type MarketNewsFilterTag,
} from "../utils/marketNews";

function MarketNewsArticle({
  item,
  expanded,
  onToggle,
}: {
  item: MarketNewsItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <article
      className={`market-news-item ${expanded ? "is-expanded" : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="market-news-item-main">
        {item.imageUrl ? (
          <img
            className="market-news-thumb"
            src={item.imageUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="market-news-thumb market-news-thumb--empty" aria-hidden />
        )}
        <div className="market-news-content">
          <h3 className="market-news-title">{item.title} »</h3>
          <div className="market-news-meta">
            <span className="market-news-author">{item.authorName}</span>
            <span className="market-news-meta-sep">|</span>
            <span className="market-news-date">{formatMarketNewsDate(item.publicationDate)}</span>
          </div>
          {expanded ? (
            <div
              className="market-news-body"
              data-no-i18n
              dangerouslySetInnerHTML={{ __html: item.html }}
            />
          ) : (
            <p className="market-news-summary">{item.summary}</p>
          )}
          <div className="market-news-footer">
            <div className="market-news-tags">
              {item.tags.map((tag) => (
                <span className="market-news-tag" key={tag.id}>
                  {formatMarketNewsTag(tag.name)}
                </span>
              ))}
            </div>
            <span className="market-news-chevron" aria-hidden>
              <ChevronDown size={18} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MarketNewsPage() {
  const { state } = usePA();
  const t = (text: string) => translateText(text, state.settings.language);
  const [selectedTag, setSelectedTag] = useState<MarketNewsFilterTag | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(
    () => filterMarketNews(state.news, selectedTag),
    [selectedTag, state.news],
  );

  const toggleTag = (tag: MarketNewsFilterTag) => {
    setSelectedTag((current) => (current === tag ? null : tag));
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="market-news-page" data-no-i18n>
      <div className="market-news-filters">
        <span className="market-news-filters-label">{t("Tags:")}</span>
        <div className="market-news-filter-tags">
          {marketNewsFilterTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`market-news-filter-tag ${selectedTag === tag ? "is-active" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className="market-news-list">
        {filtered.map((item) => (
          <MarketNewsArticle
            key={item.id}
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => toggleExpanded(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
