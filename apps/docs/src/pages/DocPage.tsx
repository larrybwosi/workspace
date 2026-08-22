import { useEffect, useState, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sidebar } from '@/components/sidebar';
import {
  SyntaxHighlighter,
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@repo/ui';
import {
  ChevronRight,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Info,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Lightbulb,
  Download,
  Shield,
  Terminal,
} from 'lucide-react';
import openapi from '../content/openapi.json';

const CodeBlock = ({ children, language }: { children: string; language: string }) => {
  return (
    <SyntaxHighlighter
      code={children.replace(/\n$/, '')}
      language={language}
      fileName={language.toUpperCase()}
      className="my-8 shadow-md border-border/10"
    />
  );
};

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleCopy}
      className="h-6 px-2 text-[10px] gap-1.5 opacity-50 hover:opacity-100 transition-opacity"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </Button>
  );
};

const SLUG_TO_TAGS_MAP: Record<string, string[]> = {
  authentication: ['V3 Authentication'],
  workspaces: ['V3 Workspaces'],
  webhooks: ['V3 Webhooks'],
  'incoming-webhooks': ['V3 Channel Incoming Webhooks'],
  organizations: ['V3 Organizations'],
};

interface DocPageProps {
  type: 'user-guide' | 'api-reference';
  defaultSlug?: string;
}

const renderSchema = (schema: any) => {
  if (!schema) return null;
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    const refSchema = (openapi as any).components.schemas[refName];
    return renderSchema(refSchema);
  }

  if (schema.type === 'object' && schema.properties) {
    return (
      <div className="space-y-2 mt-4">
        {Object.entries(schema.properties).map(([name, prop]: [string, any]) => (
          <div key={name} className="flex flex-col gap-1 py-2 border-b border-border/5 last:border-0">
            <div className="flex items-center gap-2">
              <code className="text-primary font-bold">{name}</code>
              <span className="text-xs text-muted-foreground">{prop.type || 'any'}</span>
              {schema.required?.includes(name) && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 text-red-500 border-red-500/20 bg-red-500/5">
                  Required
                </Badge>
              )}
            </div>
            {prop.description && <p className="text-sm text-muted-foreground">{prop.description}</p>}
            {prop.enum && (
              <div className="flex flex-wrap gap-1 mt-1">
                {prop.enum.map((val: string) => (
                  <code key={val} className="text-[10px] bg-muted px-1 rounded">
                    {val}
                  </code>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  return <code className="text-sm">{JSON.stringify(schema, null, 2)}</code>;
};

const generateCurl = (method: string, path: string, operation: any) => {
  let curl = `curl -X ${method.toUpperCase()} "https://api.chat.scryme.tech${path}" \\\n`;
  curl += `  -H "Authorization: Bearer <YOUR_TOKEN>"`;

  if (operation.requestBody) {
    const example =
      operation.requestBody.content?.['application/json']?.schema?.example ||
      operation.requestBody.content?.['application/json']?.schema?.properties?.file?.example ||
      {};
    curl += ` \\\n  -H "Content-Type: application/json" \\\n`;
    curl += `  -d '${JSON.stringify(example, null, 2)}'`;
  }

  return curl;
};

const getSdkNames = (operationId: string) => {
  if (!operationId) return null;
  const parts = operationId.split('_');
  let transformed = '';
  if (parts.length === 2) {
    const controller = parts[0];
    const method = parts[1];
    const capitalizedMethod = method.charAt(0).toUpperCase() + method.slice(1);
    transformed = controller + capitalizedMethod;
  } else {
    transformed = operationId;
  }
  const clientFn = transformed.charAt(0).toLowerCase() + transformed.slice(1);
  const hookName = `use${transformed.charAt(0).toUpperCase() + transformed.slice(1)}`;
  return { clientFn, hookName };
};

const generateReactSnippet = (operation: any, sdkNames: { clientFn: string; hookName: string } | null) => {
  if (!sdkNames) return '// No SDK mapping available for this endpoint';
  const { hookName } = sdkNames;
  const params = operation.parameters || [];
  const hasParams = params.length > 0;

  let snippet = `import { ${hookName} } from '@repo/v3-api';\n\n`;
  snippet += `function MyComponent() {\n`;

  if (hasParams) {
    snippet += `  // Pass parameters as required\n`;
    snippet += `  const { data, isLoading, error } = ${hookName}(\n`;
    snippet += `    {\n`;
    params.forEach((p: any) => {
      const example = p.schema?.example || p.example || (p.name === 'slug' ? 'acme-corp' : '<VALUE>');
      snippet += `      ${p.name}: ${typeof example === 'string' ? `'${example}'` : example},\n`;
    });
    snippet += `    }\n`;
    snippet += `  );\n`;
  } else {
    snippet += `  const { data, isLoading, error } = ${hookName}();\n`;
  }

  snippet += `\n  if (isLoading) return <div>Loading...</div>;\n`;
  snippet += `  if (error) return <div>Error loading data</div>;\n\n`;
  snippet += `  return <pre>{JSON.stringify(data, null, 2)}</pre>;\n`;
  snippet += `}`;
  return snippet;
};

const generateNodeSnippet = (operation: any, sdkNames: { clientFn: string; hookName: string } | null) => {
  if (!sdkNames) return '// No SDK mapping available for this endpoint';
  const { clientFn } = sdkNames;
  const params = operation.parameters || [];
  const hasParams = params.length > 0;
  const hasBody = !!operation.requestBody;

  let snippet = `import { ${clientFn} } from '@repo/v3-api/server';\n\n`;
  snippet += `async function run() {\n`;
  snippet += `  try {\n`;

  let args = [];
  if (hasBody) {
    const exampleBody = operation.requestBody.content?.['application/json']?.schema?.example || {};
    args.push(JSON.stringify(exampleBody, null, 2).replace(/\n/g, '\n    '));
  }
  if (hasParams) {
    let paramObj = `{\n`;
    params.forEach((p: any) => {
      const example = p.schema?.example || p.example || (p.name === 'slug' ? 'acme-corp' : '<VALUE>');
      paramObj += `      ${p.name}: ${typeof example === 'string' ? `'${example}'` : example},\n`;
    });
    paramObj += `    }`;
    args.push(paramObj);
  }

  const argsStr = args.join(', ');
  snippet += `    const response = await ${clientFn}(${argsStr});\n`;
  snippet += `    console.log('Success:', response.data);\n`;
  snippet += `  } catch (error) {\n`;
  snippet += `    console.error('Error executing request:', error);\n`;
  snippet += `  }\n`;
  snippet += `}`;
  return snippet;
};

const generatePythonSnippet = (method: string, path: string, operation: any) => {
  let snippet = `import requests\n\n`;
  snippet += `url = "https://api.chat.scryme.tech${path}"\n`;
  snippet += `headers = {\n`;
  snippet += `    "Authorization": "Bearer <YOUR_TOKEN>"\n`;
  if (operation.requestBody) {
    snippet += `    "Content-Type": "application/json"\n`;
  }
  snippet += `}\n\n`;

  if (operation.requestBody) {
    const example =
      operation.requestBody.content?.['application/json']?.schema?.example ||
      operation.requestBody.content?.['application/json']?.schema?.properties?.file?.example ||
      {};
    snippet += `data = ${JSON.stringify(example, null, 4)}\n\n`;
    snippet += `response = requests.${method.toLowerCase()}(url, headers=headers, json=data)\n`;
  } else {
    snippet += `response = requests.${method.toLowerCase()}(url, headers=headers)\n`;
  }

  snippet += `print(response.json())`;
  return snippet;
};

const getBadgeColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'POST':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'PATCH':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'DELETE':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
};

interface EndpointCardProps {
  method: string;
  path: string;
  operation: any;
  opId: string;
}

function EndpointCard({ method, path, operation, opId }: EndpointCardProps) {
  const [selectedLang, setSelectedLang] = useState<'ts' | 'python' | 'curl'>('ts');
  const curl = generateCurl(method, path, operation);
  const sdkNames = getSdkNames(operation.operationId);

  return (
    <Card className="overflow-hidden border-border/10 bg-muted/5">
      <CardHeader className="py-4 bg-muted/20 border-b border-border/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge className={getBadgeColor(method)}>{method.toUpperCase()}</Badge>
            <code className="text-sm font-mono opacity-80">{path}</code>
          </div>
          <div className="flex items-center gap-2">
            {operation.security && <Shield className="h-4 w-4 text-primary" />}
            <CopyButton value={path} />
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{operation.summary}</CardTitle>
        {operation.description && <p className="text-sm text-muted-foreground mt-1">{operation.description}</p>}
      </CardHeader>
      <CardContent className="py-6">
        <Tabs defaultValue="params">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-muted/50 flex-wrap">
              <TabsTrigger value="params">Parameters</TabsTrigger>
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="code" className="gap-2">
                <Terminal className="h-3 w-3" />
                Code Examples
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="params">
            {operation.parameters?.length > 0 ? (
              <div className="space-y-4">
                {operation.parameters.map((param: any) => (
                  <div key={param.name} className="flex flex-col gap-1 py-2 border-b border-border/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <code className="text-primary font-bold">{param.name}</code>
                      <Badge variant="ghost" className="text-[10px] uppercase">
                        {param.in}
                      </Badge>
                      {param.required && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-red-500 border-red-500/20">
                          Required
                        </Badge>
                      )}
                    </div>
                    {param.description && <p className="text-sm text-muted-foreground">{param.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No parameters</p>
            )}
          </TabsContent>

          <TabsContent value="request">
            {operation.requestBody ? (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  Content Type: <code>application/json</code>
                </div>
                {renderSchema(
                  operation.requestBody.content['application/json']?.schema ||
                    operation.requestBody.content['multipart/form-data']?.schema
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No request body</p>
            )}
          </TabsContent>

          <TabsContent value="responses">
            <div className="space-y-6">
              {Object.entries(operation.responses).map(([code, response]: [string, any]) => (
                <div key={code} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={code.startsWith('2') ? 'outline' : 'destructive'} className="text-[10px]">
                      {code}
                    </Badge>
                    <span className="text-sm font-medium">{response.description}</span>
                  </div>
                  {response.content?.['application/json'] && (
                    <div className="mt-2 bg-black/40 rounded-lg p-2 overflow-x-auto relative group">
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton value={JSON.stringify(response.content['application/json'].schema, null, 2)} />
                      </div>
                      <pre className="text-xs text-muted-foreground">
                        {JSON.stringify(response.content['application/json'].schema, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="code">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/5">
                <span className="text-xs text-muted-foreground font-medium">Language:</span>
                <select
                  value={selectedLang}
                  onChange={e => setSelectedLang(e.target.value as any)}
                  className="bg-muted border border-border/20 rounded px-2 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="ts">TypeScript SDK</option>
                  <option value="python">Python Requests</option>
                  <option value="curl">cURL Command</option>
                </select>
              </div>

              {selectedLang === 'ts' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        React Hook
                      </span>
                      <CopyButton value={generateReactSnippet(operation, sdkNames)} />
                    </div>
                    <div className="relative group rounded-lg overflow-hidden bg-black/90">
                      <SyntaxHighlighter code={generateReactSnippet(operation, sdkNames)} language="typescript" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Node Client
                      </span>
                      <CopyButton value={generateNodeSnippet(operation, sdkNames)} />
                    </div>
                    <div className="relative group rounded-lg overflow-hidden bg-black/90">
                      <SyntaxHighlighter code={generateNodeSnippet(operation, sdkNames)} language="typescript" />
                    </div>
                  </div>
                </div>
              )}

              {selectedLang === 'python' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Python Requests
                    </span>
                    <CopyButton value={generatePythonSnippet(method, path, operation)} />
                  </div>
                  <div className="relative group rounded-lg overflow-hidden bg-black/90">
                    <SyntaxHighlighter code={generatePythonSnippet(method, path, operation)} language="python" />
                  </div>
                </div>
              )}

              {selectedLang === 'curl' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      cURL Command
                    </span>
                    <CopyButton value={curl} />
                  </div>
                  <div className="relative group rounded-lg overflow-hidden bg-black/90">
                    <SyntaxHighlighter code={curl} language="bash" />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function DocPage({ type, defaultSlug }: DocPageProps) {
  const { slug } = useParams();
  const activeSlug = slug || defaultSlug;
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mappedTags = type === 'api-reference' && activeSlug ? SLUG_TO_TAGS_MAP[activeSlug] : null;

  useEffect(() => {
    if (!activeSlug) return;

    setLoading(true);

    if (type === 'api-reference') {
      if (SLUG_TO_TAGS_MAP[activeSlug]) {
        setContent('');
        setLoading(false);
      } else {
        setContent(null);
        setLoading(false);
      }
      return;
    }

    const folder = 'docs';

    // @ts-ignore
    const modules = import.meta.glob('../content/docs/**/*.md', { query: '?raw', import: 'default' });
    const path = `../content/docs/${activeSlug}.md`;

    if (modules[path]) {
      // @ts-ignore
      modules[path]().then((mod: string) => {
        setContent(mod);
        setLoading(false);
      });
    } else {
      setContent(null);
      setLoading(false);
    }
  }, [activeSlug, type]);

  if (!activeSlug && !defaultSlug) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return <div className="container py-10">Loading...</div>;
  }

  if (content === null) {
    return <div className="container py-10">Page not found</div>;
  }

  // Generate Table of Contents (TOC)
  let toc: Array<{ title: string; id: string }> = [];
  if (mappedTags) {
    mappedTags.forEach(tagName => {
      const tagObj = openapi.tags.find(t => t.name === tagName);
      if (tagObj) {
        toc.push({
          title: tagName,
          id: tagName.toLowerCase().replace(/\s+/g, '-'),
        });
      }
    });
  } else {
    const headings = content.match(/^##\s+.+$/gm) || [];
    toc = headings.map(h => {
      const title = h.replace(/^##\s+/, '');
      const id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      return { title, id };
    });
  }

  const githubUrl = `https://github.com/skyrme-chat/skyrme-chat/edit/main/apps/docs/src/content/${type === 'user-guide' ? 'docs' : 'api'}/${activeSlug}.md`;

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSlug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadOpenApi = () => {
    const blob = new Blob([JSON.stringify(openapi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openapi.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 flex-1">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-12 py-10">
        <div className="hidden md:block w-[220px] lg:w-[260px] shrink-0 sticky top-24 self-start h-[calc(100vh-8rem)]">
          <Sidebar type={type} />
        </div>
        <main className="flex-1 min-w-0">
          <div className="xl:grid xl:grid-cols-[1fr_250px] xl:gap-12">
            <div className="mx-auto w-full min-w-0">
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Docs
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link
                  to={type === 'user-guide' ? '/user-guide' : '/api-reference'}
                  className="hover:text-foreground transition-colors"
                >
                  {type === 'user-guide' ? 'User Guide' : 'API Reference'}
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium capitalize">{activeSlug?.replace(/-/g, ' ')}</span>
              </nav>

              {mappedTags ? (
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight mb-4 capitalize">
                    {activeSlug?.replace(/-/g, ' ')}
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    Dynamically generated reference documentation powered by our OpenAPI specification and v3 SDK
                    package.
                  </p>

                  <div className="space-y-12">
                    {mappedTags.map(tagName => {
                      const tagObj = openapi.tags.find(t => t.name === tagName);
                      const tagId = tagName.toLowerCase().replace(/\s+/g, '-');

                      // Get operations for this tag (filter to V3 starting paths only)
                      const tagOperations: Array<{ method: string; path: string; operation: any; opId: string }> = [];
                      Object.entries(openapi.paths).forEach(([path, methods]: [string, any]) => {
                        if (!path.startsWith('/api/v3/')) return;
                        Object.entries(methods).forEach(([method, operation]: [string, any]) => {
                          if (operation.tags?.includes(tagName)) {
                            const opId = `${method}-${path}`.replace(/\//g, '-');
                            tagOperations.push({ method, path, operation, opId });
                          }
                        });
                      });

                      if (tagOperations.length === 0) return null;

                      return (
                        <section key={tagName} id={tagId} className="scroll-mt-24">
                          <div className="flex items-center gap-2 mb-6 border-b border-border/10 pb-2">
                            <h2 className="text-2xl font-bold">{tagName}</h2>
                          </div>
                          {tagObj?.description && <p className="text-muted-foreground mb-6">{tagObj.description}</p>}

                          <div className="space-y-6">
                            {tagOperations.map(({ method, path, operation, opId }) => (
                              <EndpointCard key={opId} method={method} path={path} operation={operation} opId={opId} />
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/10">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-4xl font-extrabold tracking-tight mb-8 bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent border-none">
                          {children}
                        </h1>
                      ),
                      h2: ({ ...props }) => {
                        const id = props.children
                          ?.toString()
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/\s+/g, '-');
                        return (
                          <h2
                            id={id}
                            className="group flex items-center text-2xl font-semibold mt-12 mb-4 scroll-mt-24"
                            {...props}
                          >
                            {props.children}
                            <a
                              href={`#${id}`}
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                            >
                              #
                            </a>
                          </h2>
                        );
                      },
                      h3: ({ children }) => <h3 className="text-xl font-medium mt-8 mb-4">{children}</h3>,
                      p: ({ children }) => <p className="text-muted-foreground leading-7 mb-6">{children}</p>,
                      blockquote: ({ children }) => {
                        const flatten = (node: any): string => {
                          if (typeof node === 'string') return node;
                          if (Array.isArray(node)) return node.map(flatten).join('');
                          if (node?.props?.children) return flatten(node.props.children);
                          return '';
                        };

                        const text = flatten(children);
                        let Icon = Info;
                        let title = 'Note';
                        let colorClass = 'border-blue-500/50 bg-blue-500/5 text-blue-700 dark:text-blue-300';

                        if (text.includes('WARNING:')) {
                          Icon = AlertTriangle;
                          title = 'Warning';
                          colorClass = 'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-300';
                        } else if (text.includes('SUCCESS:')) {
                          Icon = CheckCircle2;
                          title = 'Success';
                          colorClass = 'border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';
                        } else if (text.includes('TIP:')) {
                          Icon = Lightbulb;
                          title = 'Tip';
                          colorClass = 'border-purple-500/50 bg-purple-500/5 text-purple-700 dark:text-purple-300';
                        }

                        const cleanChildren = Array.isArray(children)
                          ? children.map(child => {
                              if (typeof child === 'string') {
                                return child.replace(/^(WARNING:|SUCCESS:|TIP:|INFO:)\s*/, '');
                              }
                              if (child?.props?.children && typeof child.props.children === 'string') {
                                return {
                                  ...child,
                                  props: {
                                    ...child.props,
                                    children: child.props.children.replace(/^(WARNING:|SUCCESS:|TIP:|INFO:)\s*/, ''),
                                  },
                                };
                              }
                              return child;
                            })
                          : children;

                        return (
                          <div className={cn('my-6 rounded-lg border-l-4 p-4 flex gap-4', colorClass)}>
                            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-sm uppercase tracking-wider mb-1">{title}</div>
                              <div className="text-[15px] leading-relaxed opacity-90 prose-p:my-0">{cleanChildren}</div>
                            </div>
                          </div>
                        );
                      },
                      code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        return !inline && match ? (
                          <CodeBlock language={language}>{String(children)}</CodeBlock>
                        ) : (
                          <code
                            className={cn(
                              'bg-muted/80 text-primary px-1.5 py-0.5 rounded font-mono text-[13px]',
                              className
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      ol: ({ children }) => <ol className="my-8 space-y-6 [counter-reset:step]">{children}</ol>,
                      li: ({ children, ordered, ...props }: any) => {
                        if (ordered) {
                          return (
                            <li className="relative pl-10 [counter-increment:step] before:content-[counter(step)] before:absolute before:left-0 before:top-1 before:flex before:items-center before:justify-center before:w-6 before:h-6 before:rounded-full before:bg-primary/10 before:text-primary before:text-[10px] before:font-bold before:border before:border-primary/20">
                              <div className="text-muted-foreground leading-7">{children}</div>
                            </li>
                          );
                        }
                        return <li className="mb-2 ml-4 list-disc text-muted-foreground">{children}</li>;
                      },
                      table: ({ children }) => (
                        <div className="my-8 w-full overflow-hidden rounded-xl border border-border/10 bg-muted/5 shadow-sm">
                          <table className="w-full text-sm text-left">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted/20 border-b border-border/10">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-3 font-semibold text-foreground/70 uppercase tracking-wider text-[11px]">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-4 border-b border-border/5 text-muted-foreground">{children}</td>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}

              <div className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Was this page helpful?</h4>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 px-4">
                      <ThumbsUp className="mr-2 h-4 w-4" /> Yes
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 px-4">
                      <ThumbsDown className="mr-2 h-4 w-4" /> No
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2 text-sm text-muted-foreground">
                  {mappedTags ? (
                    <button
                      onClick={handleDownloadOpenApi}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download OpenAPI Spec
                    </button>
                  ) : (
                    <button
                      onClick={handleDownload}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download Markdown
                    </button>
                  )}
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Edit this page on GitHub
                  </a>
                  <a
                    href="https://discord.gg/skyrmechat"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Join our Discord community
                  </a>
                </div>
              </div>
            </div>
            <div className="hidden text-sm xl:block">
              <div className="sticky top-24 h-[calc(100vh-10rem)] overflow-y-auto scrollbar-hide">
                <h4 className="font-bold text-[11px] uppercase tracking-widest text-foreground/40 mb-4 px-2">
                  On This Page
                </h4>
                <ul className="space-y-1 border-l border-border/40 ml-2">
                  {toc.map(item => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block py-1.5 pl-4 -ml-[1px] border-l border-transparent text-muted-foreground hover:text-foreground hover:border-border transition-all duration-200"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-12 px-2 pt-8 border-t border-border/40 space-y-6">
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Stay Updated
                    </h5>
                    <p className="text-xs text-muted-foreground">Subscribe to our developer newsletter for updates.</p>
                    <div className="flex gap-2">
                      <Input placeholder="email@example.com" className="h-8 text-xs bg-muted/30 border-none" />
                      <Button size="xs">Join</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <h5 className="text-xs font-bold text-primary mb-1">Need help?</h5>
                    <p className="text-[11px] text-muted-foreground mb-3">
                      Our engineers are available to help you integrate Skyrme Chat.
                    </p>
                    <Button variant="link" size="xs" className="p-0 h-auto text-primary font-bold">
                      Contact Support &rarr;
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
