export declare const auth: import("better-auth", { with: { "resolution-mode": "import" } }).Auth<{
    database: (options: import("better-auth", { with: { "resolution-mode": "import" } }).BetterAuthOptions) => import("better-auth", { with: { "resolution-mode": "import" } }).DBAdapter<import("better-auth", { with: { "resolution-mode": "import" } }).BetterAuthOptions>;
    baseURL: string;
    emailAndPassword: {
        enabled: true;
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
    trustedOrigins: any;
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
        options: NoInfer<import("better-auth/plugins", { with: { "resolution-mode": "import" } }).AdminOptions>;
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
    }];
}>;
