'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

type Props = {
  spec: Record<string, any>;
};

function ReactSwagger({ spec }: Props) {
  return (
    <div className="swagger-light-container bg-white text-black min-h-screen">
      <style>{`
        .swagger-light-container {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
        }
        .swagger-ui {
          background-color: white !important;
          color: black !important;
        }
        .swagger-ui .info .title, 
        .swagger-ui .info li, 
        .swagger-ui .info p, 
        .swagger-ui .info table,
        .swagger-ui .opblock-tag,
        .swagger-ui .opblock .opblock-summary-operation-id, 
        .swagger-ui .opblock .opblock-summary-path, 
        .swagger-ui .opblock .opblock-summary-description,
        .swagger-ui .tab li button.tablinks,
        .swagger-ui section.models h4,
        .swagger-ui .model-title,
        .swagger-ui .parameter__name,
        .swagger-ui .parameter__type,
        .swagger-ui .parameter__in {
          color: black !important;
        }
        .swagger-ui input, .swagger-ui select, .swagger-ui textarea {
          background-color: white !important;
          color: black !important;
          border: 1px solid #ccc !important;
        }
        /* Fix for dark mode text in models */
        .swagger-ui .model-box {
          background-color: #f8f9fa !important;
        }
      `}</style>
      <SwaggerUI spec={spec} />
    </div>
  );
}

export default ReactSwagger;


