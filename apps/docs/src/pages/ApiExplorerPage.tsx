import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  SyntaxHighlighter,
  Button,
  cn,
} from '@repo/ui';
import { ChevronRight, Globe, Lock, Shield, Copy, Check, Terminal } from 'lucide-react';
import openapi from '../content/openapi.json';

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
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </Button>
  );
};

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
    curl += ` \\\n  -H "Content-Type: application/json" \\\n`;
    curl += `  -d '${JSON.stringify(operation.requestBody.content['application/json']?.schema?.example || {}, null, 2)}'`;
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

interface ExplorerCardProps {
  method: string;
  path: string;
  operation: any;
  opId: string;
}

function ExplorerCard({ method, path, operation, opId }: ExplorerCardProps) {
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

export default function ApiReferencePage() {
  const v3Tags = openapi.tags.filter(tag => tag.name.startsWith('V3'));

  return (
    <div className="max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 flex-1">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-12 py-10">
        <div className="hidden md:block w-[220px] lg:w-[260px] shrink-0 sticky top-24 self-start h-[calc(100vh-8rem)]">
          <Sidebar type="api-reference" />
        </div>
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4">V3 API Explorer</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Interactive reference explorer for Skyrme Chat V3 Enterprise client-facing endpoints.
            </p>

            <div className="space-y-12">
              {v3Tags.map(tag => {
                // Get operations for this tag (filter to V3 starting paths only)
                const tagOperations: Array<{ method: string; path: string; operation: any; opId: string }> = [];
                Object.entries(openapi.paths).forEach(([path, methods]: [string, any]) => {
                  if (!path.startsWith('/api/v3/')) return;
                  Object.entries(methods).forEach(([method, operation]: [string, any]) => {
                    if (operation.tags?.includes(tag.name)) {
                      const opId = `${method}-${path}`.replace(/\//g, '-');
                      tagOperations.push({ method, path, operation, opId });
                    }
                  });
                });

                if (tagOperations.length === 0) return null;

                return (
                  <section key={tag.name} id={tag.name.toLowerCase().replace(/\s+/g, '-')} className="scroll-mt-24">
                    <div className="flex items-center gap-2 mb-6 border-b border-border/10 pb-2">
                      <h2 className="text-2xl font-bold">{tag.name}</h2>
                    </div>
                    <p className="text-muted-foreground mb-6">{tag.description}</p>

                    <div className="space-y-6">
                      {tagOperations.map(({ method, path, operation, opId }) => (
                        <ExplorerCard key={opId} method={method} path={path} operation={operation} opId={opId} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
