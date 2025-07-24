import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle, Clock, Target, Lightbulb, Calendar, Users } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  variant?: 'chat' | 'ai-summary';
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  variant = 'chat',
  className = '' 
}) => {
  const baseClasses = variant === 'ai-summary' 
    ? 'prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700'
    : 'prose prose-sm max-w-none prose-headings:text-white prose-p:text-blue-50 prose-strong:text-white prose-ul:text-blue-50 prose-li:text-blue-50';

  const customComponents = {
    // Enhanced heading styling
    h1: ({ children }: any) => (
      <h1 className={`text-lg font-bold mb-3 flex items-center gap-2 ${
        variant === 'ai-summary' ? 'text-gray-800' : 'text-white'
      }`}>
        <Target className="h-4 w-4" />
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className={`text-base font-semibold mb-2 flex items-center gap-2 ${
        variant === 'ai-summary' ? 'text-gray-800' : 'text-white'
      }`}>
        <Lightbulb className="h-3 w-3" />
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className={`text-sm font-medium mb-2 flex items-center gap-1 ${
        variant === 'ai-summary' ? 'text-gray-700' : 'text-blue-100'
      }`}>
        <div className="w-2 h-2 bg-current rounded-full" />
        {children}
      </h3>
    ),

    // Enhanced list styling
    ul: ({ children }: any) => (
      <ul className="space-y-1 my-2">{children}</ul>
    ),
    li: ({ children }: any) => {
      const content = children.toString();
      let icon = <div className="w-1.5 h-1.5 bg-current rounded-full mt-2" />;
      
      // Smart icon detection based on content
      if (content.includes('✅') || content.includes('completed') || content.includes('done')) {
        icon = <CheckCircle className="h-3 w-3 text-green-400 mt-0.5" />;
      } else if (content.includes('⏰') || content.includes('time') || content.includes('schedule')) {
        icon = <Clock className="h-3 w-3 text-blue-400 mt-0.5" />;
      } else if (content.includes('📅') || content.includes('meeting') || content.includes('call')) {
        icon = <Calendar className="h-3 w-3 text-purple-400 mt-0.5" />;
      } else if (content.includes('team') || content.includes('people') || content.includes('participants')) {
        icon = <Users className="h-3 w-3 text-orange-400 mt-0.5" />;
      } else if (content.includes('💡') || content.includes('insight') || content.includes('tip')) {
        icon = <Lightbulb className="h-3 w-3 text-yellow-400 mt-0.5" />;
      }
      
      return (
        <li className="flex items-start gap-2">
          {icon}
          <span className="flex-1">{children}</span>
        </li>
      );
    },

    // Enhanced paragraph styling
    p: ({ children }: any) => (
      <p className={`mb-2 leading-relaxed ${
        variant === 'ai-summary' ? 'text-gray-700' : 'text-blue-50'
      }`}>
        {children}
      </p>
    ),

    // Enhanced strong/bold styling
    strong: ({ children }: any) => (
      <strong className={`font-semibold ${
        variant === 'ai-summary' 
          ? 'text-gray-900 bg-gray-100 px-1 py-0.5 rounded text-xs' 
          : 'text-white bg-white/20 px-1 py-0.5 rounded text-xs'
      }`}>
        {children}
      </strong>
    ),

    // Enhanced code styling
    code: ({ children }: any) => (
      <code className={`text-xs font-mono px-1.5 py-0.5 rounded ${
        variant === 'ai-summary'
          ? 'bg-gray-100 text-gray-800 border border-gray-200'
          : 'bg-white/20 text-blue-100 border border-white/30'
      }`}>
        {children}
      </code>
    ),

    // Enhanced blockquote styling
    blockquote: ({ children }: any) => (
      <blockquote className={`border-l-4 pl-4 py-2 my-3 italic ${
        variant === 'ai-summary'
          ? 'border-blue-300 bg-blue-50 text-blue-800'
          : 'border-white/40 bg-white/10 text-blue-100'
      }`}>
        {children}
      </blockquote>
    ),

    // Enhanced table styling (for schedule data)
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-3">
        <table className={`min-w-full text-xs border-collapse ${
          variant === 'ai-summary' ? 'border border-gray-300' : 'border border-white/30'
        }`}>
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className={`border px-2 py-1 text-left font-medium ${
        variant === 'ai-summary'
          ? 'border-gray-300 bg-gray-100 text-gray-800'
          : 'border-white/30 bg-white/20 text-white'
      }`}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className={`border px-2 py-1 ${
        variant === 'ai-summary'
          ? 'border-gray-300 text-gray-700'
          : 'border-white/30 text-blue-50'
      }`}>
        {children}
      </td>
    ),
  };

  return (
    <div className={`${baseClasses} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={customComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}; 