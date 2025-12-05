const ISOLogo = ({ standard, size = 80 }) => {
  const logos = {
    '9001': {
      color: '#0066CC',
      title: 'ISO 9001:2015',
      subtitle: 'QUALITY'
    },
    '14001': {
      color: '#009933',
      title: 'ISO 14001:2015',
      subtitle: 'ENVIRONMENT'
    },
    '45001': {
      color: '#FF6600',
      title: 'ISO 45001:2018',
      subtitle: 'OH&S'
    }
  };

  const config = logos[standard];

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle */}
      <circle cx="60" cy="60" r="58" fill="white" stroke={config.color} strokeWidth="3"/>
      
      {/* Inner decorative circle */}
      <circle cx="60" cy="60" r="50" fill="none" stroke={config.color} strokeWidth="1" opacity="0.3"/>
      
      {/* ISO text */}
      <text x="60" y="45" textAnchor="middle" fill={config.color} fontSize="20" fontWeight="bold" fontFamily="Arial, sans-serif">
        ISO
      </text>
      
      {/* Standard number */}
      <text x="60" y="65" textAnchor="middle" fill={config.color} fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">
        {standard}
      </text>
      
      {/* Subtitle */}
      <text x="60" y="80" textAnchor="middle" fill={config.color} fontSize="9" fontWeight="600" fontFamily="Arial, sans-serif">
        {config.subtitle}
      </text>
      
      {/* Year */}
      <text x="60" y="92" textAnchor="middle" fill={config.color} fontSize="8" fontFamily="Arial, sans-serif" opacity="0.7">
        {standard === '45001' ? '2018' : '2015'}
      </text>
    </svg>
  );
};

export default ISOLogo;
