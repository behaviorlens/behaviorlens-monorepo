import React from 'react';
import PropTypes from 'prop-types';
import { IconChevronDown } from '../../ui/icons';
import {
  Card,
  CardTitle,
  CollapsibleCardBody,
  CollapsibleCardHeader
} from './ScBehaviorLensDashboard';
import { ColumnCollapseButton } from '../sessions/ScBehaviorLensSessionListPage';

const CollapsibleInsightCard = ({
  bodyId,
  children,
  expanded,
  frameless = false,
  labelledBy,
  onToggle,
  showHeader = true,
  title
}) => {
  const action = expanded ? 'Collapse' : 'Expand';
  const titleId = `${bodyId}-title`;

  if (!showHeader && frameless) {
    return (
      <div
        id={bodyId}
        role="tabpanel"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        hidden={!expanded}
      >
        {children}
      </div>
    );
  }

  if (!showHeader) {
    return (
      <Card
        id={bodyId}
        role="tabpanel"
        aria-labelledby={labelledBy || titleId}
        hidden={!expanded}
      >
        {children}
      </Card>
    );
  }

  return (
    <Card>
      <CollapsibleCardHeader>
        <CardTitle id={titleId}>{title}</CardTitle>
        <ColumnCollapseButton
          type="button"
          $collapsed={!expanded}
          aria-controls={bodyId}
          aria-expanded={expanded}
          aria-label={`${action} ${title}`}
          onClick={onToggle}
        >
          <IconChevronDown width={14} height={14} />
        </ColumnCollapseButton>
      </CollapsibleCardHeader>
      <CollapsibleCardBody id={bodyId} aria-labelledby={titleId} hidden={!expanded}>
        {children}
      </CollapsibleCardBody>
    </Card>
  );
};

CollapsibleInsightCard.propTypes = {
  bodyId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  expanded: PropTypes.bool.isRequired,
  frameless: PropTypes.bool,
  labelledBy: PropTypes.string,
  onToggle: PropTypes.func,
  showHeader: PropTypes.bool,
  title: PropTypes.string.isRequired
};

export default CollapsibleInsightCard;
