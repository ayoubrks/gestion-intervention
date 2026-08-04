import React from 'react';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="glass-card">
      <h1>{title}</h1>
      <p className="text-muted">La page {title} sera développée dans les prochaines étapes.</p>
    </div>
  );
};

export default PlaceholderPage;
