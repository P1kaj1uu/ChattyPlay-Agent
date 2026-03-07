import React, { useState } from 'react'
import { Spin } from 'antd'

const WorkerAgent: React.FC = () => {
  const [loading, setLoading] = useState(true)

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
      <iframe
        src="https://ai-agent-pixel-office.vercel.app"
        width="100%"
        height="650px"
        style={{ border: 'none', opacity: loading ? 0 : 1 }}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}

export default WorkerAgent