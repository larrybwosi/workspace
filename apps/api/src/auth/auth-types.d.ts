import { auth } from "./better-auth";

export type Auth = typeof auth;

declare module "better-auth" {
    interface User {
        role: string;
    }
    interface BetterAuth {
        api: {
            getFullOrganization(options: {
                headers: Headers | Record<string, string>;
                query: { organizationSlug: string };
            }): Promise<any>;
            listMembers(options: {
                headers: Headers | Record<string, string>;
                query: { organizationId: string };
            }): Promise<any[]>;
            getSession(options: {
                headers: Headers | Record<string, string>;
            }): Promise<any>;
        };
    }
}
