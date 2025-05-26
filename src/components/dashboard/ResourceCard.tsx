import React from 'react';
import { BookOpen, FileText, CalendarDays, Briefcase, ExternalLink } from 'lucide-react';

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string;
    resource_type: string;
    url: string;
    image_url?: string;
    tags?: string[];
  };
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  // Map resource types to icons
  const resourceIcons: Record<string, React.ReactNode> = {
    'guide': <FileText className="h-5 w-5 text-primary-600" />,
    'article': <BookOpen className="h-5 w-5 text-primary-600" />,
    'video': <CalendarDays className="h-5 w-5 text-primary-600" />,
    'tool': <Briefcase className="h-5 w-5 text-primary-600" />,
  };

  const icon = resourceIcons[resource.resource_type] || <BookOpen className="h-5 w-5 text-primary-600" />;

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {resource.image_url ? (
            <img
              src={resource.image_url}
              alt={resource.title}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary-100">
              {icon}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-neutral-900">{resource.title}</h3>
            <ExternalLink className="h-4 w-4 text-neutral-400 flex-shrink-0 ml-2" />
          </div>

          <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{resource.description}</p>

          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800"
                >
                  {tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                  +{resource.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ResourceCard };
export default ResourceCard;