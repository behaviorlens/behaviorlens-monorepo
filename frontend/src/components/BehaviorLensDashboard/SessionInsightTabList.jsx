import React from 'react';
import PropTypes from 'prop-types';
import { TabItem, Tabs } from '../../ui';

export const getInsightTabId = tabId => `behaviorlens-insight-tab-${tabId}`;

// The Magnet tab strip for the right-rail panels, shared by both layouts.
const SessionInsightTabList = ({ activeInsightTab, insightTabs, selectInsightTab }) => (
  <Tabs aria-label="Session insights">
    {insightTabs.map(tab => (
      <TabItem
        key={tab.id}
        id={getInsightTabId(tab.id)}
        activeTab={activeInsightTab === tab.id}
        aria-controls={tab.bodyId}
        onClick={() => selectInsightTab(tab.id)}
      >
        {tab.label}
      </TabItem>
    ))}
  </Tabs>
);

SessionInsightTabList.propTypes = {
  activeInsightTab: PropTypes.string.isRequired,
  insightTabs: PropTypes.array.isRequired,
  selectInsightTab: PropTypes.func.isRequired
};

export default SessionInsightTabList;
