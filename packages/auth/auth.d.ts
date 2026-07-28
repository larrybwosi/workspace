export declare const auth: import("better-auth", { with: { "resolution-mode": "import" } }).Auth<{
    database: (options: import("@better-auth/core", { with: { "resolution-mode": "import" } }).BetterAuthOptions) => import(".pnpm/@better-auth+core@1.6.22_@better-auth+utils@0.4.2_@better-fetch+fetch@1.3.1_@openteleme_8f6197c307fb8d809d03f60ae83b1857/node_modules/@better-auth/core/db/adapter", { with: { "resolution-mode": "import" } }).DBAdapter<import("@better-auth/core", { with: { "resolution-mode": "import" } }).BetterAuthOptions>;
    baseURL: any;
    emailAndPassword: {
        enabled: true;
        requireEmailVerification: false;
    };
    socialProviders: {
        instagram?: {
            clientId: string;
            clientSecret: string;
        } | undefined;
        github?: {
            clientId: string;
            clientSecret: string;
        } | undefined;
        google?: {
            clientId: string;
            clientSecret: string;
        } | undefined;
    };
    trustedOrigins: any[];
    user: {
        additionalFields: {
            bio: {
                type: "string";
                required: false;
            };
        };
    };
    plugins: [{
        id: "jwt";
        version: string;
        options: NoInfer<import("better-auth/plugins", { with: { "resolution-mode": "import" } }).JwtOptions>;
        endpoints: {
            getJwks: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<string, {
                method: "GET";
                metadata: {
                    openapi: {
                        operationId: string;
                        description: string;
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                keys: {
                                                    type: string;
                                                    description: string;
                                                    items: {
                                                        type: string;
                                                        properties: {
                                                            kid: {
                                                                type: string;
                                                                description: string;
                                                            };
                                                            kty: {
                                                                type: string;
                                                                description: string;
                                                            };
                                                            alg: {
                                                                type: string;
                                                                description: string;
                                                            };
                                                            use: {
                                                                type: string;
                                                                description: string;
                                                                enum: string[];
                                                                nullable: boolean;
                                                            };
                                                            n: {
                                                                type: string;
                                                                description: string;
                                                                nullable: boolean;
                                                            };
                                                            e: {
                                                                type: string;
                                                                description: string;
                                                                nullable: boolean;
                                                            };
                                                            crv: {
                                                                type: string;
                                                                description: string;
                                                                nullable: boolean;
                                                            };
                                                            x: {
                                                                type: string;
                                                                description: string;
                                                                nullable: boolean;
                                                            };
                                                            y: {
                                                                type: string;
                                                                description: string;
                                                                nullable: boolean;
                                                            };
                                                        };
                                                        required: string[];
                                                    };
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, import("better-auth", { with: { "resolution-mode": "import" } }).JSONWebKeySet>;
            getToken: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/token", {
                method: "GET";
                requireHeaders: true;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                token: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                token: string;
            }>;
            signJWT: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<string, {
                method: "POST";
                metadata: {
                    $Infer: {
                        body: {
                            payload: import("better-auth", { with: { "resolution-mode": "import" } }).JWTPayload;
                            overrideOptions?: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).JwtOptions | undefined;
                        };
                    };
                };
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    payload: import("better-auth", { with: { "resolution-mode": "import" } }).ZodRecord<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodAny>;
                    overrideOptions: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodRecord<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodAny>>;
                }, import("zod/v4/core").$strip>;
            }, {
                token: string;
            }>;
            verifyJWT: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<string, {
                method: "POST";
                metadata: {
                    $Infer: {
                        body: {
                            token: string;
                            issuer?: string;
                        };
                        response: {
                            payload: {
                                sub: string;
                                aud: string;
                                [key: string]: any;
                            } | null;
                        };
                    };
                };
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    token: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    issuer: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>;
            }, {
                payload: (import("better-auth", { with: { "resolution-mode": "import" } }).JWTPayload & Required<Pick<import("better-auth", { with: { "resolution-mode": "import" } }).JWTPayload, "sub" | "aud">>) | null;
            }>;
        };
        hooks: {
            after: {
                matcher(context: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): boolean;
                handler: (inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<void>;
            }[];
        };
        schema: {
            jwks: {
                fields: {
                    publicKey: {
                        type: "string";
                        required: true;
                    };
                    privateKey: {
                        type: "string";
                        required: true;
                    };
                    createdAt: {
                        type: "date";
                        required: true;
                    };
                    expiresAt: {
                        type: "date";
                        required: false;
                    };
                };
            };
        };
    }, {
        id: "organization";
        version: string;
        endpoints: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).OrganizationEndpoints<import("better-auth/plugins", { with: { "resolution-mode": "import" } }).OrganizationOptions & {
            teams: {
                enabled: true;
            };
            dynamicAccessControl?: {
                enabled?: false | undefined;
            } | undefined;
        }> & import("better-auth/plugins", { with: { "resolution-mode": "import" } }).TeamEndpoints<import("better-auth/plugins", { with: { "resolution-mode": "import" } }).OrganizationOptions & {
            teams: {
                enabled: true;
            };
            dynamicAccessControl?: {
                enabled?: false | undefined;
            } | undefined;
        }>;
        schema: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).OrganizationSchema<import("better-auth/plugins", { with: { "resolution-mode": "import" } }).OrganizationOptions & {
            teams: {
                enabled: true;
            };
            dynamicAccessControl?: {
                enabled?: false | undefined;
            } | undefined;
        }>;
        $Infer: {
            Organization: {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                logo?: string | null | undefined;
                metadata?: any;
            };
            Invitation: {
                id: string;
                organizationId: string;
                email: string;
                role: "admin" | "member" | "owner";
                status: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).InvitationStatus;
                inviterId: string;
                expiresAt: Date;
                createdAt: Date;
                teamId?: string | undefined | undefined;
            };
            Member: {
                id: string;
                organizationId: string;
                role: "admin" | "member" | "owner";
                createdAt: Date;
                userId: string;
                teamId?: string | undefined | undefined;
                user: {
                    id: string;
                    email: string;
                    name: string;
                    image?: string | undefined;
                };
            };
            Team: {
                id: string;
                name: string;
                organizationId: string;
                createdAt: Date;
                updatedAt?: Date | undefined;
            };
            TeamMember: {
                id: string;
                teamId: string;
                userId: string;
                createdAt: Date;
            };
            ActiveOrganization: {
                members: {
                    id: string;
                    organizationId: string;
                    role: "admin" | "member" | "owner";
                    createdAt: Date;
                    userId: string;
                    teamId?: string | undefined | undefined;
                    user: {
                        id: string;
                        email: string;
                        name: string;
                        image?: string | undefined;
                    };
                }[];
                invitations: {
                    id: string;
                    organizationId: string;
                    email: string;
                    role: "admin" | "member" | "owner";
                    status: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).InvitationStatus;
                    inviterId: string;
                    expiresAt: Date;
                    createdAt: Date;
                    teamId?: string | undefined | undefined;
                }[];
                teams: {
                    id: string;
                    name: string;
                    organizationId: string;
                    createdAt: Date;
                    updatedAt?: Date | undefined;
                }[];
            } & {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                logo?: string | null | undefined;
                metadata?: any;
            };
        };
        $ERROR_CODES: {
            YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION">;
            YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS">;
            ORGANIZATION_ALREADY_EXISTS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"ORGANIZATION_ALREADY_EXISTS">;
            ORGANIZATION_SLUG_ALREADY_TAKEN: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"ORGANIZATION_SLUG_ALREADY_TAKEN">;
            ORGANIZATION_NOT_FOUND: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"ORGANIZATION_NOT_FOUND">;
            USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION">;
            YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION">;
            YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION">;
            NO_ACTIVE_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"NO_ACTIVE_ORGANIZATION">;
            USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION">;
            MEMBER_NOT_FOUND: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"MEMBER_NOT_FOUND">;
            ROLE_NOT_FOUND: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"ROLE_NOT_FOUND">;
            YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM">;
            TEAM_ALREADY_EXISTS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"TEAM_ALREADY_EXISTS">;
            TEAM_NOT_FOUND: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"TEAM_NOT_FOUND">;
            YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER">;
            YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER">;
            YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER">;
            YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION">;
            USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION">;
            INVITATION_NOT_FOUND: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVITATION_NOT_FOUND">;
            YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION">;
            EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION">;
            EMAIL_VERIFICATION_REQUIRED_FOR_INVITATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"EMAIL_VERIFICATION_REQUIRED_FOR_INVITATION">;
            YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION">;
            INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVITER_IS_NO_LONGER_A_MEMBER_OF_THE_ORGANIZATION">;
            YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE">;
            FAILED_TO_RETRIEVE_INVITATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"FAILED_TO_RETRIEVE_INVITATION">;
            YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_TEAMS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_TEAMS">;
            UNABLE_TO_REMOVE_LAST_TEAM: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"UNABLE_TO_REMOVE_LAST_TEAM">;
            YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER">;
            ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"ORGANIZATION_MEMBERSHIP_LIMIT_REACHED">;
            YOU_ARE_NOT_ALLOWED_TO_CREATE_TEAMS_IN_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_CREATE_TEAMS_IN_THIS_ORGANIZATION">;
            YOU_ARE_NOT_ALLOWED_TO_DELETE_TEAMS_IN_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_DELETE_TEAMS_IN_THIS_ORGANIZATION">;
            YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_TEAM: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_TEAM">;
            YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_TEAM: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_TEAM">;
            INVITATION_LIMIT_REACHED: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVITATION_LIMIT_REACHED">;
            TEAM_MEMBER_LIMIT_REACHED: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"TEAM_MEMBER_LIMIT_REACHED">;
            USER_IS_NOT_A_MEMBER_OF_THE_TEAM: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USER_IS_NOT_A_MEMBER_OF_THE_TEAM">;
            YOU_CAN_NOT_ACCESS_THE_MEMBERS_OF_THIS_TEAM: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_CAN_NOT_ACCESS_THE_MEMBERS_OF_THIS_TEAM">;
            YOU_DO_NOT_HAVE_AN_ACTIVE_TEAM: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_DO_NOT_HAVE_AN_ACTIVE_TEAM">;
            YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM_MEMBER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_TEAM_MEMBER">;
            YOU_ARE_NOT_ALLOWED_TO_REMOVE_A_TEAM_MEMBER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_REMOVE_A_TEAM_MEMBER">;
            YOU_ARE_NOT_ALLOWED_TO_ACCESS_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_ACCESS_THIS_ORGANIZATION">;
            YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION">;
            MISSING_AC_INSTANCE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"MISSING_AC_INSTANCE">;
            YOU_MUST_BE_IN_AN_ORGANIZATION_TO_CREATE_A_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_MUST_BE_IN_AN_ORGANIZATION_TO_CREATE_A_ROLE">;
            YOU_ARE_NOT_ALLOWED_TO_CREATE_A_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_CREATE_A_ROLE">;
            YOU_ARE_NOT_ALLOWED_TO_UPDATE_A_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_UPDATE_A_ROLE">;
            YOU_ARE_NOT_ALLOWED_TO_DELETE_A_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_DELETE_A_ROLE">;
            YOU_ARE_NOT_ALLOWED_TO_READ_A_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_READ_A_ROLE">;
            YOU_ARE_NOT_ALLOWED_TO_LIST_A_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_LIST_A_ROLE">;
            YOU_ARE_NOT_ALLOWED_TO_GET_A_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_GET_A_ROLE">;
            TOO_MANY_ROLES: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"TOO_MANY_ROLES">;
            INVALID_RESOURCE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_RESOURCE">;
            ROLE_NAME_IS_ALREADY_TAKEN: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"ROLE_NAME_IS_ALREADY_TAKEN">;
            CANNOT_DELETE_A_PRE_DEFINED_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"CANNOT_DELETE_A_PRE_DEFINED_ROLE">;
            ROLE_IS_ASSIGNED_TO_MEMBERS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"ROLE_IS_ASSIGNED_TO_MEMBERS">;
            INVALID_TEAM_ID: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_TEAM_ID">;
        };
        options: NoInfer<import("better-auth/plugins", { with: { "resolution-mode": "import" } }).OrganizationOptions & {
            teams: {
                enabled: true;
            };
            dynamicAccessControl?: {
                enabled?: false | undefined;
            } | undefined;
        }>;
    }, {
        id: "username";
        version: string;
        init(ctx: import("better-auth", { with: { "resolution-mode": "import" } }).AuthContext): {
            options: {
                databaseHooks: {
                    user: {
                        create: {
                            before(user: {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                email: string;
                                emailVerified: boolean;
                                name: string;
                                image?: string | null | undefined;
                            } & Record<string, unknown>, context: import("better-auth", { with: { "resolution-mode": "import" } }).GenericEndpointContext | null): Promise<{
                                data: {
                                    username: string;
                                    displayUsername: string;
                                    id: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    email: string;
                                    emailVerified: boolean;
                                    name: string;
                                    image?: string | null | undefined;
                                };
                            } | {
                                data: {
                                    displayUsername?: string | undefined;
                                    id: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    email: string;
                                    emailVerified: boolean;
                                    name: string;
                                    image?: string | null | undefined;
                                };
                            }>;
                        };
                        update: {
                            before(user: Partial<{
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                email: string;
                                emailVerified: boolean;
                                name: string;
                                image?: string | null | undefined;
                            }> & Record<string, unknown>, context: import("better-auth", { with: { "resolution-mode": "import" } }).GenericEndpointContext | null): Promise<{
                                data: {
                                    displayUsername?: string | undefined;
                                    username: string;
                                    id?: string | undefined;
                                    createdAt?: Date | undefined;
                                    updatedAt?: Date | undefined;
                                    email?: string | undefined;
                                    emailVerified?: boolean | undefined;
                                    name?: string | undefined;
                                    image?: string | null | undefined;
                                };
                            } | {
                                data: {
                                    displayUsername?: string | undefined;
                                    id?: string | undefined;
                                    createdAt?: Date | undefined;
                                    updatedAt?: Date | undefined;
                                    email?: string | undefined;
                                    emailVerified?: boolean | undefined;
                                    name?: string | undefined;
                                    image?: string | null | undefined;
                                };
                            }>;
                        };
                    };
                };
            };
        };
        endpoints: {
            signInUsername: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/sign-in/username", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    username: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    password: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    rememberMe: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                    callbackURL: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                redirect: {
                                                    type: string;
                                                    description: string;
                                                };
                                                token: {
                                                    type: string;
                                                    description: string;
                                                };
                                                url: {
                                                    type: string;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                            422: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                message: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                redirect: boolean;
                token: string;
                url: string | undefined;
                user: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    emailVerified: boolean;
                    name: string;
                    image?: string | null | undefined;
                } & {
                    username: string;
                    displayUsername: string;
                };
            }>;
            isUsernameAvailable: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/is-username-available", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    username: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
            }, {
                available: boolean;
            }>;
        };
        schema: {
            user: {
                fields: {
                    username: {
                        type: "string";
                        required: false;
                        sortable: true;
                        unique: true;
                        returned: true;
                        transform: {
                            input(value: import("better-auth", { with: { "resolution-mode": "import" } }).DBPrimitive): string | number | boolean | Date | Record<string, unknown> | unknown[] | null | undefined;
                        };
                    };
                    displayUsername: {
                        type: "string";
                        required: false;
                        transform: {
                            input(value: import("better-auth", { with: { "resolution-mode": "import" } }).DBPrimitive): string | number | boolean | Date | Record<string, unknown> | unknown[] | null | undefined;
                        };
                    };
                };
            };
        };
        hooks: {
            before: {
                matcher(context: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): boolean;
                handler: (inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<void>;
            }[];
        };
        options: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UsernameOptions | undefined;
        $ERROR_CODES: {
            EMAIL_NOT_VERIFIED: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"EMAIL_NOT_VERIFIED">;
            UNEXPECTED_ERROR: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"UNEXPECTED_ERROR">;
            INVALID_USERNAME_OR_PASSWORD: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_USERNAME_OR_PASSWORD">;
            USERNAME_IS_ALREADY_TAKEN: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USERNAME_IS_ALREADY_TAKEN">;
            USERNAME_TOO_SHORT: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USERNAME_TOO_SHORT">;
            USERNAME_TOO_LONG: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USERNAME_TOO_LONG">;
            INVALID_USERNAME: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_USERNAME">;
            INVALID_DISPLAY_USERNAME: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_DISPLAY_USERNAME">;
        };
    }, {
        id: "admin";
        version: string;
        init(): {
            options: {
                databaseHooks: {
                    user: {
                        create: {
                            before(user: {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                email: string;
                                emailVerified: boolean;
                                name: string;
                                image?: string | null | undefined;
                            } & Record<string, unknown>): Promise<{
                                data: {
                                    id: string;
                                    createdAt: Date;
                                    updatedAt: Date;
                                    email: string;
                                    emailVerified: boolean;
                                    name: string;
                                    image?: string | null | undefined;
                                    role: string;
                                };
                            }>;
                        };
                    };
                    session: {
                        create: {
                            before(session: {
                                id: string;
                                createdAt: Date;
                                updatedAt: Date;
                                userId: string;
                                expiresAt: Date;
                                token: string;
                                ipAddress?: string | null | undefined;
                                userAgent?: string | null | undefined;
                            } & Record<string, unknown>, ctx: import("better-auth", { with: { "resolution-mode": "import" } }).GenericEndpointContext | null): Promise<void>;
                        };
                    };
                };
            };
        };
        hooks: {
            after: {
                matcher(context: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): boolean;
                handler: (inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<import("better-auth/plugins", { with: { "resolution-mode": "import" } }).SessionWithImpersonatedBy[] | undefined>;
            }[];
        };
        endpoints: {
            setRole: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/set-role", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                    role: import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<readonly [import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>]>;
                }, import("zod/v4/core").$strip>;
                requireHeaders: true;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    $Infer: {
                        body: {
                            userId: string;
                            role: "user" | "admin" | ("user" | "admin")[];
                        };
                    };
                };
            }, {
                user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
            }>;
            getUser: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/get-user", {
                method: "GET";
                query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole>;
            createUser: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/create-user", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    email: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    password: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    name: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    role: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<readonly [import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>]>>;
                    data: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodRecord<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodAny>>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    $Infer: {
                        body: {
                            email: string;
                            password?: string | undefined;
                            name: string;
                            role?: "user" | "admin" | ("user" | "admin")[] | undefined;
                            data?: Record<string, any> | undefined;
                        };
                    };
                };
            }, {
                user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
            }>;
            adminUpdateUser: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/update-user", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                    data: import("better-auth", { with: { "resolution-mode": "import" } }).ZodRecord<import("better-auth", { with: { "resolution-mode": "import" } }).ZodAny, import("better-auth", { with: { "resolution-mode": "import" } }).ZodAny>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole>;
            listUsers: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/list-users", {
                method: "GET";
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    searchValue: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    searchField: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        email: "email";
                        name: "name";
                    }>>;
                    searchOperator: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        contains: "contains";
                        starts_with: "starts_with";
                        ends_with: "ends_with";
                    }>>;
                    limit: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<[import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodNumber]>>;
                    offset: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<[import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodNumber]>>;
                    sortBy: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    sortDirection: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        asc: "asc";
                        desc: "desc";
                    }>>;
                    filterField: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    filterValue: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<[import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<[import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<[import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<[import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodNumber]>, import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean]>, import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>]>, import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodNumber>]>>;
                    filterOperator: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        eq: "eq";
                        ne: "ne";
                        gt: "gt";
                        gte: "gte";
                        lt: "lt";
                        lte: "lte";
                        in: "in";
                        not_in: "not_in";
                        contains: "contains";
                        starts_with: "starts_with";
                        ends_with: "ends_with";
                    }>>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                users: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                                total: {
                                                    type: string;
                                                };
                                                limit: {
                                                    type: string;
                                                };
                                                offset: {
                                                    type: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                users: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole[];
                total: number;
            }>;
            listUserSessions: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/list-user-sessions", {
                method: "POST";
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                sessions: {
                                                    type: string;
                                                    items: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                sessions: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).SessionWithImpersonatedBy[];
            }>;
            unbanUser: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/unban-user", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
            }>;
            banUser: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/ban-user", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                    banReason: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    banExpiresIn: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodNumber>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
            }>;
            impersonateUser: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/impersonate-user", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                session: {
                                                    $ref: string;
                                                };
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                };
                user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
            }>;
            stopImpersonating: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/stop-impersonating", {
                method: "POST";
                requireHeaders: true;
            }, {
                session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } & Record<string, any>;
                user: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    emailVerified: boolean;
                    name: string;
                    image?: string | null | undefined;
                } & Record<string, any>;
            }>;
            revokeUserSession: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/revoke-user-session", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    sessionToken: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                success: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                success: boolean;
            }>;
            revokeUserSessions: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/revoke-user-sessions", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                success: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                success: boolean;
            }>;
            removeUser: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/remove-user", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                success: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                success: boolean;
            }>;
            setUserPassword: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/set-user-password", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    newPassword: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        user: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).UserWithRole;
                        session: {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        operationId: string;
                        summary: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                status: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                status: boolean;
            }>;
            userHasPermission: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/has-permission", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodIntersection<import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userId: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodCoercedString<unknown>>;
                    role: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>, import("better-auth", { with: { "resolution-mode": "import" } }).ZodXor<readonly [import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    permission: import("better-auth", { with: { "resolution-mode": "import" } }).ZodRecord<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>>;
                }, import("zod/v4/core").$strip>, import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    permissions: import("better-auth", { with: { "resolution-mode": "import" } }).ZodRecord<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>>;
                }, import("zod/v4/core").$strip>]>>;
                metadata: {
                    openapi: {
                        description: string;
                        requestBody: {
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object";
                                        properties: {
                                            permissions: {
                                                type: string;
                                                description: string;
                                            };
                                        };
                                        required: string[];
                                    };
                                };
                            };
                        };
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                };
                                                success: {
                                                    type: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                    $Infer: {
                        body: {
                            permissions: {
                                readonly user?: ("list" | "update" | "delete" | "get" | "create" | "set-role" | "ban" | "impersonate" | "impersonate-admins" | "set-password" | "set-email")[] | undefined;
                                readonly session?: ("list" | "delete" | "revoke")[] | undefined;
                            };
                        } & {
                            userId?: string | undefined;
                            role?: "user" | "admin" | undefined;
                        };
                    };
                };
            }, {
                error: null;
                success: boolean;
            }>;
        };
        $ERROR_CODES: {
            USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL">;
            FAILED_TO_CREATE_USER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"FAILED_TO_CREATE_USER">;
            USER_ALREADY_EXISTS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USER_ALREADY_EXISTS">;
            YOU_CANNOT_BAN_YOURSELF: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_CANNOT_BAN_YOURSELF">;
            YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE">;
            YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS">;
            YOU_ARE_NOT_ALLOWED_TO_LIST_USERS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_LIST_USERS">;
            YOU_ARE_NOT_ALLOWED_TO_LIST_USERS_SESSIONS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_LIST_USERS_SESSIONS">;
            YOU_ARE_NOT_ALLOWED_TO_BAN_USERS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_BAN_USERS">;
            YOU_ARE_NOT_ALLOWED_TO_IMPERSONATE_USERS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_IMPERSONATE_USERS">;
            YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS">;
            YOU_ARE_NOT_ALLOWED_TO_DELETE_USERS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_DELETE_USERS">;
            YOU_ARE_NOT_ALLOWED_TO_SET_USERS_PASSWORD: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_SET_USERS_PASSWORD">;
            BANNED_USER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"BANNED_USER">;
            YOU_ARE_NOT_ALLOWED_TO_GET_USER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_GET_USER">;
            NO_DATA_TO_UPDATE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"NO_DATA_TO_UPDATE">;
            YOU_ARE_NOT_ALLOWED_TO_UPDATE_USERS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_UPDATE_USERS">;
            YOU_CANNOT_REMOVE_YOURSELF: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_CANNOT_REMOVE_YOURSELF">;
            YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE">;
            YOU_CANNOT_IMPERSONATE_ADMINS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_CANNOT_IMPERSONATE_ADMINS">;
            INVALID_ROLE_TYPE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_ROLE_TYPE">;
            YOU_ARE_NOT_ALLOWED_TO_SET_USERS_EMAIL: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"YOU_ARE_NOT_ALLOWED_TO_SET_USERS_EMAIL">;
            PASSWORD_CANNOT_BE_UPDATED_VIA_UPDATE_USER: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"PASSWORD_CANNOT_BE_UPDATED_VIA_UPDATE_USER">;
        };
        schema: {
            user: {
                fields: {
                    role: {
                        type: "string";
                        required: false;
                        input: false;
                    };
                    banned: {
                        type: "boolean";
                        defaultValue: false;
                        required: false;
                        input: false;
                    };
                    banReason: {
                        type: "string";
                        required: false;
                        input: false;
                    };
                    banExpires: {
                        type: "date";
                        required: false;
                        input: false;
                    };
                };
            };
            session: {
                fields: {
                    impersonatedBy: {
                        type: "string";
                        required: false;
                        input: false;
                    };
                };
            };
        };
        options: NoInfer<{
            defaultRole: string;
        }>;
    }, {
        id: "bearer";
        version: string;
        hooks: {
            before: {
                matcher(context: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): boolean;
                handler: (inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    context: {
                        headers: Headers;
                    };
                } | undefined>;
            }[];
            after: {
                matcher(context: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): true;
                handler: (inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<void>;
            }[];
        };
        options: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).BearerOptions | undefined;
    }, {
        id: "device-authorization";
        version: string;
        schema: {
            deviceCode: {
                fields: {
                    deviceCode: {
                        type: "string";
                        required: true;
                    };
                    userCode: {
                        type: "string";
                        required: true;
                    };
                    userId: {
                        type: "string";
                        required: false;
                    };
                    expiresAt: {
                        type: "date";
                        required: true;
                    };
                    status: {
                        type: "string";
                        required: true;
                    };
                    lastPolledAt: {
                        type: "date";
                        required: false;
                    };
                    pollingInterval: {
                        type: "number";
                        required: false;
                    };
                    clientId: {
                        type: "string";
                        required: false;
                    };
                    scope: {
                        type: "string";
                        required: false;
                    };
                };
            };
        };
        endpoints: {
            deviceCode: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/device/code", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    user_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>;
                error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        invalid_request: "invalid_request";
                        invalid_client: "invalid_client";
                    }>;
                    error_description: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                device_code: {
                                                    type: string;
                                                    description: string;
                                                };
                                                user_code: {
                                                    type: string;
                                                    description: string;
                                                };
                                                verification_uri: {
                                                    type: string;
                                                    format: string;
                                                    description: string;
                                                };
                                                verification_uri_complete: {
                                                    type: string;
                                                    format: string;
                                                    description: string;
                                                };
                                                expires_in: {
                                                    type: string;
                                                    description: string;
                                                };
                                                interval: {
                                                    type: string;
                                                    description: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            400: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                    enum: string[];
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                device_code: string;
                user_code: string;
                verification_uri: string;
                verification_uri_complete: string;
                expires_in: number;
                interval: number;
            }>;
            deviceToken: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/device/token", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    grant_type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodLiteral<"urn:ietf:params:oauth:grant-type:device_code">;
                    device_code: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        invalid_request: "invalid_request";
                        authorization_pending: "authorization_pending";
                        slow_down: "slow_down";
                        expired_token: "expired_token";
                        access_denied: "access_denied";
                        invalid_grant: "invalid_grant";
                    }>;
                    error_description: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                session: {
                                                    $ref: string;
                                                };
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            400: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                    enum: string[];
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                access_token: string;
                token_type: string;
                expires_in: number;
                scope: string;
            }>;
            deviceVerify: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/device", {
                method: "GET";
                query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    user_code: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        invalid_request: "invalid_request";
                    }>;
                    error_description: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                user_code: {
                                                    type: string;
                                                    description: string;
                                                };
                                                status: {
                                                    type: string;
                                                    enum: string[];
                                                    description: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                user_code: string;
                status: string;
            }>;
            deviceApprove: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/device/approve", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userCode: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        invalid_request: "invalid_request";
                        expired_token: "expired_token";
                        access_denied: "access_denied";
                        device_code_already_processed: "device_code_already_processed";
                        unauthorized: "unauthorized";
                    }>;
                    error_description: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                requireHeaders: true;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                success: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                success: boolean;
            }>;
            deviceDeny: import("better-auth", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/device/deny", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    userCode: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    error: import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        invalid_request: "invalid_request";
                        expired_token: "expired_token";
                        access_denied: "access_denied";
                        unauthorized: "unauthorized";
                    }>;
                    error_description: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                requireHeaders: true;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                success: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                success: boolean;
            }>;
        };
        $ERROR_CODES: {
            USER_NOT_FOUND: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"USER_NOT_FOUND">;
            FAILED_TO_CREATE_SESSION: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"FAILED_TO_CREATE_SESSION">;
            INVALID_DEVICE_CODE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_DEVICE_CODE">;
            EXPIRED_DEVICE_CODE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"EXPIRED_DEVICE_CODE">;
            EXPIRED_USER_CODE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"EXPIRED_USER_CODE">;
            AUTHORIZATION_PENDING: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"AUTHORIZATION_PENDING">;
            ACCESS_DENIED: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"ACCESS_DENIED">;
            INVALID_USER_CODE: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_USER_CODE">;
            DEVICE_CODE_ALREADY_PROCESSED: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"DEVICE_CODE_ALREADY_PROCESSED">;
            DEVICE_CODE_NOT_CLAIMED: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"DEVICE_CODE_NOT_CLAIMED">;
            POLLING_TOO_FREQUENTLY: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"POLLING_TOO_FREQUENTLY">;
            INVALID_DEVICE_CODE_STATUS: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"INVALID_DEVICE_CODE_STATUS">;
            AUTHENTICATION_REQUIRED: import("better-auth", { with: { "resolution-mode": "import" } }).RawError<"AUTHENTICATION_REQUIRED">;
        };
        options: Partial<{
            expiresIn: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).TimeString;
            interval: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).TimeString;
            deviceCodeLength: number;
            userCodeLength: number;
            schema: {
                deviceCode?: {
                    modelName?: string | undefined;
                    fields?: {
                        deviceCode?: string | undefined;
                        userCode?: string | undefined;
                        userId?: string | undefined;
                        expiresAt?: string | undefined;
                        status?: string | undefined;
                        lastPolledAt?: string | undefined;
                        pollingInterval?: string | undefined;
                        clientId?: string | undefined;
                        scope?: string | undefined;
                    } | undefined;
                } | undefined;
            };
            generateDeviceCode?: (() => string | Promise<string>) | undefined;
            generateUserCode?: (() => string | Promise<string>) | undefined;
            validateClient?: ((clientId: string) => boolean | Promise<boolean>) | undefined;
            onDeviceAuthRequest?: ((clientId: string, scope: string | undefined) => void | Promise<void>) | undefined;
            verificationUri?: string | undefined;
        }>;
    }, {
        id: "oauth-provider";
        version: string;
        options: NoInfer<{
            loginPage: string;
            consentPage: string;
            allowDynamicClientRegistration: true;
            silenceWarnings: {
                oauthAuthServerConfig: true;
            };
            scopes: ("email" | "openid" | "profile" | "offline_access" | "channels:read" | "channels:write" | "members:read" | "members:write" | "messages:send" | "workspaces:read")[];
        }>;
        init: (ctx: import("better-auth", { with: { "resolution-mode": "import" } }).AuthContext) => void;
        onRequest: (request: Request, ctx: import("better-auth", { with: { "resolution-mode": "import" } }).AuthContext) => Promise<{
            response: Response;
        } | {
            request: Request;
        } | void>;
        hooks: {
            before: {
                matcher(ctx: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): any;
                handler: (inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<void>;
            }[];
            after: {
                matcher(ctx: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): boolean;
                handler: (inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    redirect: boolean;
                    url: string;
                } | undefined>;
            }[];
        };
        endpoints: {
            getOAuthServerConfig: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/.well-known/oauth-authorization-server", {
                method: "GET";
                metadata: {
                    SERVER_ONLY: true;
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).AuthServerMetadata>;
            getOpenIdConfig: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/.well-known/openid-configuration", {
                method: "GET";
                metadata: {
                    SERVER_ONLY: true;
                };
            }, Omit<import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OIDCMetadata, "id_token_signing_alg_values_supported"> & {
                id_token_signing_alg_values_supported: import("better-auth/plugins", { with: { "resolution-mode": "import" } }).JWSAlgorithms[] | ["HS256"];
            }>;
            oauth2Authorize: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/authorize", {
                method: "GET";
                query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    response_type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        code: "code";
                    }>>;
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    redirect_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>;
                    scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    state: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    request_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    code_challenge: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    code_challenge_method: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        S256: "S256";
                    }>>;
                    nonce: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    prompt: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        none: "none";
                        consent: "consent";
                        login: "login";
                        create: "create";
                        select_account: "select_account";
                        "login consent": "login consent";
                        "select_account consent": "select_account consent";
                    }>>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        parameters: ({
                            name: string;
                            in: "query";
                            required: false;
                            schema: {
                                type: "string";
                                format?: undefined;
                            };
                            description: string;
                        } | {
                            name: string;
                            in: "query";
                            required: true;
                            schema: {
                                type: "string";
                                format?: undefined;
                            };
                            description: string;
                        } | {
                            name: string;
                            in: "query";
                            required: false;
                            schema: {
                                type: "string";
                                format: string;
                            };
                            description: string;
                        })[];
                        responses: {
                            "302": {
                                description: string;
                                headers: {
                                    Location: {
                                        description: string;
                                        schema: {
                                            type: string;
                                            format: string;
                                        };
                                    };
                                };
                            };
                            "400": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                                state: {
                                                    type: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                redirect: boolean;
                url: string;
            }>;
            oauth2Consent: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/consent", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    accept: import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean;
                    scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    oauth_query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                redirect_uri: {
                                                    type: string;
                                                    format: string;
                                                    description: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                redirect: boolean;
                url: string;
            } | {
                redirect: boolean;
                url: string;
            }>;
            oauth2Continue: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/continue", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    selected: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                    created: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                    postLogin: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                    oauth_query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                redirect_uri: {
                                                    type: string;
                                                    format: string;
                                                    description: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                redirect: boolean;
                url: string;
            }>;
            oauth2Token: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/token", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    grant_type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        authorization_code: "authorization_code";
                        client_credentials: "client_credentials";
                        refresh_token: "refresh_token";
                    }>;
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_secret: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    code: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    code_verifier: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    redirect_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>;
                    refresh_token: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    resource: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    allowedMediaTypes: string[];
                    openapi: {
                        description: string;
                        requestBody: {
                            required: boolean;
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object";
                                        properties: {
                                            grant_type: {
                                                type: string;
                                                enum: string[];
                                                description: string;
                                            };
                                            client_id: {
                                                type: string;
                                                description: string;
                                            };
                                            client_secret: {
                                                type: string;
                                                description: string;
                                            };
                                            code: {
                                                type: string;
                                                description: string;
                                            };
                                            code_verifier: {
                                                type: string;
                                                description: string;
                                            };
                                            redirect_uri: {
                                                type: string;
                                                format: string;
                                                description: string;
                                            };
                                            refresh_token: {
                                                type: string;
                                                description: string;
                                            };
                                            resource: {
                                                type: string;
                                                description: string;
                                            };
                                            scope: {
                                                type: string;
                                                description: string;
                                            };
                                        };
                                        required: string[];
                                    };
                                };
                            };
                        };
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                access_token: {
                                                    type: string;
                                                    description: string;
                                                };
                                                token_type: {
                                                    type: string;
                                                    description: string;
                                                    enum: string[];
                                                };
                                                expires_in: {
                                                    type: string;
                                                    description: string;
                                                };
                                                refresh_token: {
                                                    type: string;
                                                    description: string;
                                                };
                                                scope: {
                                                    type: string;
                                                    description: string;
                                                };
                                                id_token: {
                                                    type: string;
                                                    description: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                            "400": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                                error_uri: {
                                                    type: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                access_token: string;
                expires_in: number;
                expires_at: number;
                token_type: "Bearer";
                refresh_token: string | undefined;
                scope: string;
                id_token: string | undefined;
            }>;
            oauth2Introspect: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/introspect", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_secret: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    token: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    token_type_hint: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        refresh_token: "refresh_token";
                        access_token: "access_token";
                    }>>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    allowedMediaTypes: string[];
                    openapi: {
                        description: string;
                        requestBody: {
                            required: boolean;
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object";
                                        properties: {
                                            client_id: {
                                                type: string;
                                                description: string;
                                            };
                                            client_secret: {
                                                type: string;
                                                description: string;
                                            };
                                            token: {
                                                type: string;
                                                description: string;
                                            };
                                            token_type_hint: {
                                                type: string;
                                                enum: string[];
                                                description: string;
                                            };
                                            resource: {
                                                type: string;
                                                description: string;
                                            };
                                        };
                                        required: string[];
                                    };
                                };
                            };
                        };
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                active: {
                                                    type: string;
                                                    description: string;
                                                };
                                                scope: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                username: {
                                                    type: string;
                                                    description: string;
                                                };
                                                token_type: {
                                                    type: string;
                                                    description: string;
                                                };
                                                exp: {
                                                    type: string;
                                                    description: string;
                                                };
                                                iat: {
                                                    type: string;
                                                    description: string;
                                                };
                                                nbf: {
                                                    type: string;
                                                    description: string;
                                                };
                                                sub: {
                                                    type: string;
                                                    description: string;
                                                };
                                                aud: {
                                                    type: string;
                                                    description: string;
                                                };
                                                iss: {
                                                    type: string;
                                                    description: string;
                                                };
                                                jti: {
                                                    type: string;
                                                    description: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                            "400": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                                error_uri: {
                                                    type: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, import("better-auth", { with: { "resolution-mode": "import" } }).JWTPayload>;
            oauth2Revoke: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/revoke", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_secret: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    token: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    token_type_hint: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        refresh_token: "refresh_token";
                        access_token: "access_token";
                    }>>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    allowedMediaTypes: string[];
                    openapi: {
                        description: string;
                        requestBody: {
                            required: boolean;
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object";
                                        properties: {
                                            client_id: {
                                                type: string;
                                                description: string;
                                            };
                                            client_secret: {
                                                type: string;
                                                description: string;
                                            };
                                            token: {
                                                type: string;
                                                description: string;
                                            };
                                            token_type_hint: {
                                                type: string;
                                                enum: string[];
                                                description: string;
                                            };
                                        };
                                        required: string[];
                                    };
                                };
                            };
                        };
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            description: string;
                                        };
                                    };
                                };
                            };
                            "400": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                                error_uri: {
                                                    type: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, null | undefined>;
            oauth2UserInfo: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/userinfo", {
                method: ("GET" | "POST")[];
                metadata: {
                    openapi: {
                        description: string;
                        security: ({
                            bearerAuth: never[];
                            OAuth2?: undefined;
                        } | {
                            OAuth2: string[];
                            bearerAuth?: undefined;
                        })[];
                        parameters: {
                            name: string;
                            in: "header";
                            required: false;
                            schema: {
                                type: "string";
                            };
                            description: string;
                        }[];
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                sub: {
                                                    type: string;
                                                    description: string;
                                                };
                                                email: {
                                                    type: string;
                                                    format: string;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                                name: {
                                                    type: string;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                                picture: {
                                                    type: string;
                                                    format: string;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                                given_name: {
                                                    type: string;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                                family_name: {
                                                    type: string;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                                email_verified: {
                                                    type: string;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                            "401": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                            "403": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                error: {
                                                    type: string;
                                                };
                                                error_description: {
                                                    type: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                email?: string | undefined;
                email_verified?: boolean | undefined;
                name?: string | undefined;
                picture?: string | undefined;
                given_name?: string | undefined;
                family_name?: string | undefined;
                sub: string;
            }>;
            oauth2EndSession: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/end-session", {
                method: "GET";
                query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    id_token_hint: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    post_logout_redirect_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>;
                    state: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                redirect_uri: {
                                                    type: string;
                                                    format: string;
                                                    description: string;
                                                };
                                                message: {
                                                    type: string;
                                                    description: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                redirect: boolean;
                url: string;
            } | undefined>;
            registerOAuthClient: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/register", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>;
                    scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_name: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    logo_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    contacts: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>>;
                    tos_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    policy_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_version: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_statement: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    post_logout_redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>>;
                    token_endpoint_auth_method: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        none: "none";
                        client_secret_basic: "client_secret_basic";
                        client_secret_post: "client_secret_post";
                    }>>>;
                    grant_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        authorization_code: "authorization_code";
                        client_credentials: "client_credentials";
                        refresh_token: "refresh_token";
                    }>>>>;
                    response_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        code: "code";
                    }>>>>;
                    type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        web: "web";
                        native: "native";
                        "user-agent-based": "user-agent-based";
                    }>>;
                    subject_type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        public: "public";
                        pairwise: "pairwise";
                    }>>;
                    skip_consent: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodNever>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                client_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_secret: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_secret_expires_at: {
                                                    type: string;
                                                    description: string;
                                                };
                                                scope: {
                                                    type: string;
                                                    description: string;
                                                };
                                                user_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_id_issued_at: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_name: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                logo_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                contacts: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                    description: string;
                                                };
                                                tos_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                policy_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_version: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_statement: {
                                                    type: string;
                                                    description: string;
                                                };
                                                redirect_uris: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    description: string;
                                                };
                                                post_logout_redirect_uris: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    description: string;
                                                };
                                                token_endpoint_auth_method: {
                                                    type: string;
                                                    description: string;
                                                    enum: string[];
                                                };
                                                grant_types: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        enum: string[];
                                                    };
                                                    description: string;
                                                };
                                                response_types: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        enum: string[];
                                                    };
                                                    description: string;
                                                };
                                                public: {
                                                    type: string;
                                                    description: string;
                                                };
                                                type: {
                                                    type: string;
                                                    description: string;
                                                    enum: string[];
                                                };
                                                disabled: {
                                                    type: string;
                                                    description: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            adminCreateOAuthClient: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/oauth2/create-client", {
                method: "POST";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>;
                    scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_name: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    logo_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    contacts: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>>;
                    tos_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    policy_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_version: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_statement: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    post_logout_redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>>;
                    token_endpoint_auth_method: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        none: "none";
                        client_secret_basic: "client_secret_basic";
                        client_secret_post: "client_secret_post";
                    }>>>;
                    grant_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        authorization_code: "authorization_code";
                        client_credentials: "client_credentials";
                        refresh_token: "refresh_token";
                    }>>>>;
                    response_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        code: "code";
                    }>>>>;
                    type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        web: "web";
                        native: "native";
                        "user-agent-based": "user-agent-based";
                    }>>;
                    client_secret_expires_at: import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<readonly [import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodNumber]>>>;
                    skip_consent: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                    enable_end_session: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                    require_pkce: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                    subject_type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        public: "public";
                        pairwise: "pairwise";
                    }>>;
                    metadata: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodRecord<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnknown>>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    SERVER_ONLY: true;
                    openapi: {
                        description: string;
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                client_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_secret: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_secret_expires_at: {
                                                    type: string;
                                                    description: string;
                                                };
                                                scope: {
                                                    type: string;
                                                    description: string;
                                                };
                                                user_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_id_issued_at: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_name: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                logo_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                contacts: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                    description: string;
                                                };
                                                tos_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                policy_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_version: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_statement: {
                                                    type: string;
                                                    description: string;
                                                };
                                                redirect_uris: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    description: string;
                                                };
                                                token_endpoint_auth_method: {
                                                    type: string;
                                                    description: string;
                                                    enum: string[];
                                                };
                                                grant_types: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        enum: string[];
                                                    };
                                                    description: string;
                                                };
                                                response_types: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        enum: string[];
                                                    };
                                                    description: string;
                                                };
                                                public: {
                                                    type: string;
                                                    description: string;
                                                };
                                                type: {
                                                    type: string;
                                                    description: string;
                                                    enum: string[];
                                                };
                                                disabled: {
                                                    type: string;
                                                    description: string;
                                                };
                                                require_pkce: {
                                                    type: string;
                                                    description: string;
                                                    default: boolean;
                                                };
                                                metadata: {
                                                    type: string;
                                                    additionalProperties: boolean;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            createOAuthClient: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/create-client", {
                method: "POST";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>;
                    scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_name: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    client_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    logo_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    contacts: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>>;
                    tos_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    policy_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_version: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    software_statement: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    post_logout_redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>>;
                    token_endpoint_auth_method: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        none: "none";
                        client_secret_basic: "client_secret_basic";
                        client_secret_post: "client_secret_post";
                    }>>>;
                    grant_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        authorization_code: "authorization_code";
                        client_credentials: "client_credentials";
                        refresh_token: "refresh_token";
                    }>>>>;
                    response_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodDefault<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        code: "code";
                    }>>>>;
                    type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                        web: "web";
                        native: "native";
                        "user-agent-based": "user-agent-based";
                    }>>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                        responses: {
                            "200": {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                client_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_secret: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_secret_expires_at: {
                                                    type: string;
                                                    description: string;
                                                };
                                                scope: {
                                                    type: string;
                                                    description: string;
                                                };
                                                user_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_id_issued_at: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_name: {
                                                    type: string;
                                                    description: string;
                                                };
                                                client_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                logo_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                contacts: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                    };
                                                    description: string;
                                                };
                                                tos_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                policy_uri: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_id: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_version: {
                                                    type: string;
                                                    description: string;
                                                };
                                                software_statement: {
                                                    type: string;
                                                    description: string;
                                                };
                                                redirect_uris: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                    description: string;
                                                };
                                                token_endpoint_auth_method: {
                                                    type: string;
                                                    description: string;
                                                    enum: string[];
                                                };
                                                grant_types: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        enum: string[];
                                                    };
                                                    description: string;
                                                };
                                                response_types: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        enum: string[];
                                                    };
                                                    description: string;
                                                };
                                                public: {
                                                    type: string;
                                                    description: string;
                                                };
                                                type: {
                                                    type: string;
                                                    description: string;
                                                    enum: string[];
                                                };
                                                disabled: {
                                                    type: string;
                                                    description: string;
                                                };
                                                metadata: {
                                                    type: string;
                                                    additionalProperties: boolean;
                                                    nullable: boolean;
                                                    description: string;
                                                };
                                            };
                                            required: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            getOAuthClient: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/get-client", {
                method: "GET";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            getOAuthClientPublic: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/public-client", {
                method: "GET";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            getOAuthClientPublicPrelogin: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/public-client-prelogin", {
                method: "POST";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<void>)[];
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    oauth_query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            getOAuthClients: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/get-clients", {
                method: "GET";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient[] | null>;
            adminUpdateOAuthClient: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/admin/oauth2/update-client", {
                method: "PATCH";
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    update: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                        redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>>;
                        scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        client_name: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        client_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        logo_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        contacts: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>>;
                        tos_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        policy_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        software_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        software_version: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        software_statement: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        post_logout_redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>>;
                        grant_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                            authorization_code: "authorization_code";
                            client_credentials: "client_credentials";
                            refresh_token: "refresh_token";
                        }>>>;
                        response_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                            code: "code";
                        }>>>;
                        type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                            web: "web";
                            native: "native";
                            "user-agent-based": "user-agent-based";
                        }>>;
                        client_secret_expires_at: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnion<readonly [import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodNumber]>>;
                        skip_consent: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                        enable_end_session: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodBoolean>;
                        metadata: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodRecord<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString, import("better-auth", { with: { "resolution-mode": "import" } }).ZodUnknown>>;
                    }, import("zod/v4/core").$strip>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    SERVER_ONLY: true;
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            updateOAuthClient: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/update-client", {
                method: "POST";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    update: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                        redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>>;
                        scope: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        client_name: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        client_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        logo_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        contacts: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>>;
                        tos_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        policy_uri: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        software_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        software_version: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        software_statement: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                        post_logout_redirect_uris: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodURL>>;
                        grant_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                            authorization_code: "authorization_code";
                            client_credentials: "client_credentials";
                            refresh_token: "refresh_token";
                        }>>>;
                        response_types: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                            code: "code";
                        }>>>;
                        type: import("better-auth", { with: { "resolution-mode": "import" } }).ZodOptional<import("better-auth", { with: { "resolution-mode": "import" } }).ZodEnum<{
                            web: "web";
                            native: "native";
                            "user-agent-based": "user-agent-based";
                        }>>;
                    }, import("zod/v4/core").$strip>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            rotateClientSecret: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/client/rotate-secret", {
                method: "POST";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthClient>;
            deleteOAuthClient: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/delete-client", {
                method: "POST";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    client_id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, void>;
            getOAuthConsent: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/get-consent", {
                method: "GET";
                query: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthConsent<import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).Scope[]>>;
            getOAuthConsents: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/get-consents", {
                method: "GET";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthConsent<import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).Scope[]>[]>;
            updateOAuthConsent: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/update-consent", {
                method: "POST";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                    update: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                        scopes: import("better-auth", { with: { "resolution-mode": "import" } }).ZodArray<import("better-auth", { with: { "resolution-mode": "import" } }).ZodString>;
                    }, import("zod/v4/core").$strip>;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).OAuthConsent<import("@better-auth/oauth-provider", { with: { "resolution-mode": "import" } }).Scope[]> | null>;
            deleteOAuthConsent: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/endpoint.mjs", { with: { "resolution-mode": "import" } }).StrictEndpoint<"/oauth2/delete-consent", {
                method: "POST";
                use: ((inputContext: import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("../../node_modules/.pnpm/better-call@1.3.7_zod@4.3.6/node_modules/better-call/dist/middleware.mjs", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<{
                    session: {
                        session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                        };
                        user: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            email: string;
                            emailVerified: boolean;
                            name: string;
                            image?: string | null | undefined;
                        };
                    };
                }>)[];
                body: import("better-auth", { with: { "resolution-mode": "import" } }).ZodObject<{
                    id: import("better-auth", { with: { "resolution-mode": "import" } }).ZodString;
                }, import("zod/v4/core").$strip>;
                metadata: {
                    openapi: {
                        description: string;
                    };
                };
            }, void>;
        };
        schema: {
            oauthClient: {
                modelName: string;
                fields: {
                    clientId: {
                        type: "string";
                        unique: true;
                        required: true;
                    };
                    clientSecret: {
                        type: "string";
                        required: false;
                    };
                    disabled: {
                        type: "boolean";
                        defaultValue: false;
                        required: false;
                    };
                    skipConsent: {
                        type: "boolean";
                        required: false;
                    };
                    enableEndSession: {
                        type: "boolean";
                        required: false;
                    };
                    subjectType: {
                        type: "string";
                        required: false;
                    };
                    scopes: {
                        type: "string[]";
                        required: false;
                    };
                    userId: {
                        type: "string";
                        required: false;
                        references: {
                            model: string;
                            field: string;
                        };
                        index: true;
                    };
                    createdAt: {
                        type: "date";
                        required: false;
                    };
                    updatedAt: {
                        type: "date";
                        required: false;
                    };
                    name: {
                        type: "string";
                        required: false;
                    };
                    uri: {
                        type: "string";
                        required: false;
                    };
                    icon: {
                        type: "string";
                        required: false;
                    };
                    contacts: {
                        type: "string[]";
                        required: false;
                    };
                    tos: {
                        type: "string";
                        required: false;
                    };
                    policy: {
                        type: "string";
                        required: false;
                    };
                    softwareId: {
                        type: "string";
                        required: false;
                    };
                    softwareVersion: {
                        type: "string";
                        required: false;
                    };
                    softwareStatement: {
                        type: "string";
                        required: false;
                    };
                    redirectUris: {
                        type: "string[]";
                        required: true;
                    };
                    postLogoutRedirectUris: {
                        type: "string[]";
                        required: false;
                    };
                    tokenEndpointAuthMethod: {
                        type: "string";
                        required: false;
                    };
                    grantTypes: {
                        type: "string[]";
                        required: false;
                    };
                    responseTypes: {
                        type: "string[]";
                        required: false;
                    };
                    public: {
                        type: "boolean";
                        required: false;
                    };
                    type: {
                        type: "string";
                        required: false;
                    };
                    requirePKCE: {
                        type: "boolean";
                        required: false;
                    };
                    referenceId: {
                        type: "string";
                        required: false;
                    };
                    metadata: {
                        type: "json";
                        required: false;
                    };
                };
            };
            oauthRefreshToken: {
                fields: {
                    token: {
                        type: "string";
                        required: true;
                        unique: true;
                    };
                    clientId: {
                        type: "string";
                        required: true;
                        references: {
                            model: string;
                            field: string;
                        };
                        index: true;
                    };
                    sessionId: {
                        type: "string";
                        required: false;
                        references: {
                            model: string;
                            field: string;
                            onDelete: "set null";
                        };
                        index: true;
                    };
                    userId: {
                        type: "string";
                        required: true;
                        references: {
                            model: string;
                            field: string;
                        };
                        index: true;
                    };
                    referenceId: {
                        type: "string";
                        required: false;
                    };
                    expiresAt: {
                        type: "date";
                    };
                    createdAt: {
                        type: "date";
                    };
                    revoked: {
                        type: "date";
                        required: false;
                    };
                    authTime: {
                        type: "date";
                        required: false;
                    };
                    scopes: {
                        type: "string[]";
                        required: true;
                    };
                };
            };
            oauthAccessToken: {
                modelName: string;
                fields: {
                    token: {
                        type: "string";
                        unique: true;
                    };
                    clientId: {
                        type: "string";
                        required: true;
                        references: {
                            model: string;
                            field: string;
                        };
                        index: true;
                    };
                    sessionId: {
                        type: "string";
                        required: false;
                        references: {
                            model: string;
                            field: string;
                            onDelete: "set null";
                        };
                        index: true;
                    };
                    userId: {
                        type: "string";
                        required: false;
                        references: {
                            model: string;
                            field: string;
                        };
                        index: true;
                    };
                    referenceId: {
                        type: "string";
                        required: false;
                    };
                    refreshId: {
                        type: "string";
                        required: false;
                        references: {
                            model: string;
                            field: string;
                        };
                        index: true;
                    };
                    expiresAt: {
                        type: "date";
                    };
                    createdAt: {
                        type: "date";
                    };
                    scopes: {
                        type: "string[]";
                        required: true;
                    };
                };
            };
            oauthConsent: {
                modelName: string;
                fields: {
                    clientId: {
                        type: "string";
                        required: true;
                        references: {
                            model: string;
                            field: string;
                        };
                        index: true;
                    };
                    userId: {
                        type: "string";
                        required: false;
                        references: {
                            model: string;
                            field: string;
                        };
                        index: true;
                    };
                    referenceId: {
                        type: "string";
                        required: false;
                    };
                    scopes: {
                        type: "string[]";
                        required: true;
                    };
                    createdAt: {
                        type: "date";
                    };
                    updatedAt: {
                        type: "date";
                    };
                };
            };
        };
        rateLimit: ({
            pathMatcher: (path: string) => path is "/oauth2/token";
            window: number;
            max: number;
        } | {
            pathMatcher: (path: string) => path is "/oauth2/authorize";
            window: number;
            max: number;
        } | {
            pathMatcher: (path: string) => path is "/oauth2/introspect";
            window: number;
            max: number;
        } | {
            pathMatcher: (path: string) => path is "/oauth2/revoke";
            window: number;
            max: number;
        } | {
            pathMatcher: (path: string) => path is "/oauth2/register";
            window: number;
            max: number;
        } | {
            pathMatcher: (path: string) => path is "/oauth2/userinfo";
            window: number;
            max: number;
        })[];
    }, {
        id: "next-cookies";
        version: string;
        hooks: {
            before: {
                matcher(ctx: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): boolean;
                handler: (inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<void>;
            }[];
            after: {
                matcher(ctx: import("better-auth", { with: { "resolution-mode": "import" } }).HookEndpointContext): true;
                handler: (inputContext: import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareInputContext<import("better-auth", { with: { "resolution-mode": "import" } }).MiddlewareOptions>) => Promise<void>;
            }[];
        };
    }];
}>;
