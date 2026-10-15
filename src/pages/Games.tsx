import React, { useState } from 'react'
import { Spin } from 'antd'

const Games: React.FC = () => {
  // 生产环境下才显示加载效果
  const [loading, setLoading] = useState(process.env.NODE_ENV === 'production')

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1
        }}>
          <Spin size="large" />
        </div>
      )}
      {/* 生产环境下才显示iframe */}
      {process.env.NODE_ENV === 'production' && (
        <iframe
          src={import.meta.env.VITE_GAMES_API_URL}
          width="100%"
          height="650px"
          style={{ border: 'none', opacity: loading ? 0 : 1 }}
          onLoad={() => setLoading(false)}
        />
      )}
    </div>
  );
}

export default Games
