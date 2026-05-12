'use client';

import { useState } from 'react';
import { Search, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/card';
import { Input } from '../../../components/input';
import { Button } from '../../../components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/table';
import { Badge } from '../../../components/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/avatar';
import { useCustomerProfiles } from '@repo/api-client';

export function CustomersTab({ workspaceId }: { workspaceId: string }) {
  const [search, setSearch] = useState('');
  const { data: customers, isLoading } = useCustomerProfiles(workspaceId);

  const filteredCustomers =
    customers?.filter(
      (customer: any) =>
        customer.user.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.user.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.company?.toLowerCase().includes(search.toLowerCase())
    ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">Manage external customers and their CRM metadata</p>
        </div>
        <Button>
          <ExternalLink className="mr-2 h-4 w-4" />
          Sync with CRM
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customers</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No customers found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>CRM ID</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={customer.user.avatar} />
                          <AvatarFallback>{customer.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.user.name}</div>
                          <div className="text-xs text-muted-foreground">{customer.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{customer.crmId}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
