import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Badge, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, SyntaxHighlighter } from '@repo/ui';
import { ChevronRight, Globe, Lock, Shield } from 'lucide-react';
import openapi from '../content/openapi.json';

export default function ApiReferencePage() {
  const [spec] = useState(openapi);

  const getBadgeColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'POST': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PATCH': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const renderSchema = (schema: any) => {
    if (!schema) return null;
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      const refSchema = (spec as any).components.schemas[refName];
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
                {schema.required?.includes(name) && <Badge variant="outline" className="text-[10px] h-4 px-1 text-red-500 border-red-500/20 bg-red-500/5">Required</Badge>}
              </div>
              {prop.description && <p className="text-sm text-muted-foreground">{prop.description}</p>}
              {prop.enum && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {prop.enum.map((val: string) => (
                    <code key={val} className="text-[10px] bg-muted px-1 rounded">{val}</code>
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

  return (
    <div className="max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 flex-1">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-12 py-10">
        <div className="hidden md:block w-[220px] lg:w-[260px] shrink-0 sticky top-24 self-start h-[calc(100vh-8rem)]">
          <Sidebar type="api-reference" />
        </div>
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4">{spec.info.title}</h1>
            <p className="text-xl text-muted-foreground mb-8">{spec.info.description}</p>

            <div className="space-y-12">
              {spec.tags.map(tag => (
                <section key={tag.name} id={tag.name.toLowerCase().replace(/\s+/g, '-')} className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-6 border-b border-border/10 pb-2">
                    <h2 className="text-2xl font-bold">{tag.name}</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">{tag.description}</p>

                  <div className="space-y-6">
                    {Object.entries(spec.paths).map(([path, methods]: [string, any]) => (
                      Object.entries(methods).map(([method, operation]: [string, any]) => {
                        if (!operation.tags?.includes(tag.name)) return null;

                        const opId = `${method}-${path}`.replace(/\//g, '-');

                        return (
                          <Card key={opId} className="overflow-hidden border-border/10 bg-muted/5">
                            <CardHeader className="py-4 bg-muted/20 border-b border-border/5">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <Badge className={getBadgeColor(method)}>{method.toUpperCase()}</Badge>
                                  <code className="text-sm font-mono opacity-80">{path}</code>
                                </div>
                                <div className="flex items-center gap-2">
                                  {operation.security && <Shield className="h-4 w-4 text-primary" />}
                                </div>
                              </div>
                              <CardTitle className="text-lg mt-2">{operation.summary}</CardTitle>
                              {operation.description && <p className="text-sm text-muted-foreground mt-1">{operation.description}</p>}
                            </CardHeader>
                            <CardContent className="py-6">
                              <Tabs defaultValue="params">
                                <TabsList className="mb-4 bg-muted/50">
                                  <TabsTrigger value="params">Parameters</TabsTrigger>
                                  <TabsTrigger value="request">Request</TabsTrigger>
                                  <TabsTrigger value="responses">Responses</TabsTrigger>
                                </TabsList>

                                <TabsContent value="params">
                                  {operation.parameters?.length > 0 ? (
                                    <div className="space-y-4">
                                      {operation.parameters.map((param: any) => (
                                        <div key={param.name} className="flex flex-col gap-1 py-2 border-b border-border/5 last:border-0">
                                          <div className="flex items-center gap-2">
                                            <code className="text-primary font-bold">{param.name}</code>
                                            <Badge variant="ghost" className="text-[10px] uppercase">{param.in}</Badge>
                                            {param.required && <Badge variant="outline" className="text-[10px] h-4 px-1 text-red-500 border-red-500/20">Required</Badge>}
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
                                      <div className="text-sm font-medium">Content Type: <code>application/json</code></div>
                                      {renderSchema(operation.requestBody.content['application/json']?.schema || operation.requestBody.content['multipart/form-data']?.schema)}
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
                                          <Badge variant={code.startsWith('2') ? 'outline' : 'destructive'} className="text-[10px]">{code}</Badge>
                                          <span className="text-sm font-medium">{response.description}</span>
                                        </div>
                                        {response.content?.['application/json'] && (
                                          <div className="mt-2 bg-black/40 rounded-lg p-2 overflow-x-auto">
                                            <pre className="text-xs text-muted-foreground">
                                              {JSON.stringify(response.content['application/json'].schema, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </CardContent>
                          </Card>
                        );
                      })
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
