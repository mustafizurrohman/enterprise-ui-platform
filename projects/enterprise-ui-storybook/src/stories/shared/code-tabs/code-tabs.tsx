import { type KeyboardEvent, type ReactElement, useId, useState } from 'react';
import { Source } from '@storybook/addon-docs/blocks';

import './code-tabs.scss';

/**
 * Supported languages for the Storybook Source block.
 */
type SourceLanguage =
  | 'typescript'
  | 'tsx'
  | 'jsx'
  | 'jsextra'
  | 'json'
  | 'yml'
  | 'md'
  | 'bash'
  | 'css'
  | 'html'
  | 'graphql'
  | 'scss';

export interface CodeTab {
  /**
   * Display label for the tab.
   */
  label: string;
  /**
   * Raw source code to display.
   */
  code: string;
  /**
   * Syntax highlighting language.
   */
  language: SourceLanguage;
}

export interface CodeTabsProps {
  /**
   * Array of tabs to display.
   */
  tabs: CodeTab[];
  /**
   * Zero-based index of the initially selected tab.
   */
  initialTab?: number;
  /**
   * Accessible label for the tab list.
   */
  ariaLabel?: string;
}

/**
 * A reusable Storybook documentation component that displays source files in tabs.
 * Uses Storybook's public Source block for code rendering.
 */
export const CodeTabs = ({
  tabs,
  initialTab = 0,
  ariaLabel = 'Source files',
}: CodeTabsProps): ReactElement | null => {
  const componentId = useId();

  // Clamp initialTab to valid range
  const safeInitialTab = tabs.length > 0 ? Math.min(Math.max(initialTab, 0), tabs.length - 1) : 0;

  const [activeTabIndex, setActiveTabIndex] = useState(safeInitialTab);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  /**
   * Selects a tab and moves focus to it for keyboard accessibility.
   */
  const selectAndFocusTab = (index: number): void => {
    const normalizedIndex = (index + tabs.length) % tabs.length;

    setActiveTabIndex(normalizedIndex);

    // requestAnimationFrame ensures the DOM has updated before we attempt to focus
    requestAnimationFrame(() => {
      document.getElementById(`${componentId}-tab-${normalizedIndex}`)?.focus();
    });
  };

  /**
   * Handles keyboard navigation according to WAI-ARIA Authoring Practices.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        selectAndFocusTab(index - 1);
        break;

      case 'ArrowRight':
        event.preventDefault();
        selectAndFocusTab(index + 1);
        break;

      case 'Home':
        event.preventDefault();
        selectAndFocusTab(0);
        break;

      case 'End':
        event.preventDefault();
        selectAndFocusTab(tabs.length - 1);
        break;
    }
  };

  const activeTab = tabs[activeTabIndex];

  return (
    <div className="docs-code-tabs">
      <div
        aria-label={ariaLabel}
        className="docs-code-tabs__tab-list"
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeTabIndex;
          const tabId = `${componentId}-tab-${index}`;
          const panelId = `${componentId}-panel-${index}`;

          return (
            <button
              aria-controls={panelId}
              aria-selected={isActive}
              className="docs-code-tabs__tab"
              id={tabId}
              key={`${tab.label}-${index}`}
              onClick={() => setActiveTabIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`${componentId}-tab-${activeTabIndex}`}
        className="docs-code-tabs__panel"
        id={`${componentId}-panel-${activeTabIndex}`}
        role="tabpanel"
        tabIndex={0}
      >
        <Source
          code={(activeTab.code || '').trim()}
          dark
          language={activeTab.language}
        />
      </div>
    </div>
  );
};
