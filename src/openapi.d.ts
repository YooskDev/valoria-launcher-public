import type {
    OpenAPIClient,
    Parameters,
    UnknownParamsObject,
    OperationResponse,
    AxiosRequestConfig,
} from "openapi-client-axios";

declare namespace Components {
    namespace Schemas {
        export interface AccessTokenDto {
            token: string;
            expiresAt: string; // date-time
        }
        export interface AccessTokenFailDto {
            reason:
                | "invalid_username"
                | "invalid_password"
                | "totp_required"
                | "invalid_totp";
        }
        export interface ChangeEmailDto {
            email: string; // email
        }
        export interface ChangePasswordDto {
            password: string;
        }
        export interface ChangeTotpDto {
            secret: string;
        }
        export interface ChangeUsernameDto {
            username: string; // /^[a-zA-Z0-9_]+$/
        }
        export interface CreateAccessTokenDto {
            username: string; // ^[a-zA-Z0-9_]+$
            password: string;
            totpCode?: string;
        }
        export interface CreateUserDto {
            username: string; // ^[a-zA-Z0-9_]+$
            password: string;
        }
        export interface ModpackDownloadDto {
            url: string; // uri
            checksum: string;
        }
        export interface ModpackDto {
            id: string; // uuid
            name: string;
            description?: string;
            iconUrl?: string;
            serverAddress?: string;
            version: string;
            requiredRole?: string;
            maintenance?: ModpackMaintenanceDto;
            canPlay: boolean;
        }
        export interface ModpackListDto {
            modpacks: ModpackDto[];
        }
        export interface ModpackMaintenanceDto {
            startsAt: string; // date-time
            endsAt?: string; // date-time
            message: string;
        }
        export interface ProfileDto {
            id: string; // uuid
            username: string;
            hasTotp: boolean;
            forcedTotp: boolean;
            email?: string;
            slimArms: boolean;
            skinUrl: string;
            roles: string[];
            ban?: UserBanDto;
        }
        export interface UserBanDto {
            reason: string;
            issuedAt: string; // date-time
            expiresAt?: string; // date-time
        }
        export interface UserDto {
            id: string; // uuid
            username: string;
            hasTotp: boolean;
            forcedTotp: boolean;
            email?: string;
            slimArms: boolean;
            skinUrl: string;
            roles: string[];
            ban?: UserBanDto;
        }
        export interface UserListDto {
            users: UserDto[];
        }
    }
}
declare namespace Paths {
    namespace ConfirmEmail {
        namespace Parameters {
            export type Code = string;
        }
        export interface PathParameters {
            code: Parameters.Code;
        }
        namespace Responses {
            export interface $204 {}
            export interface $403 {}
            export interface $404 {}
        }
    }
    namespace CreateAccessToken {
        export type RequestBody = Components.Schemas.CreateAccessTokenDto;
        namespace Responses {
            export type $201 = Components.Schemas.AccessTokenDto;
            export type $403 = Components.Schemas.AccessTokenFailDto;
        }
    }
    namespace CreateUser {
        export type RequestBody = Components.Schemas.CreateUserDto;
        namespace Responses {
            export interface $404 {}
            export interface $409 {}
        }
    }
    namespace ExchangeAccessToken {
        namespace Responses {
            export type $201 = Components.Schemas.AccessTokenDto;
            export interface $403 {}
        }
    }
    namespace GetModpackBundle {
        namespace Parameters {
            export type Id = string;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
        namespace Responses {
            export type $200 = Components.Schemas.ModpackDownloadDto;
            export interface $403 {}
            export interface $404 {}
        }
    }
    namespace GetModpacks {
        namespace Responses {
            export type $200 = Components.Schemas.ModpackListDto;
            export interface $403 {}
        }
    }
    namespace GetProfile {
        namespace Responses {
            export type $200 = Components.Schemas.ProfileDto;
            export interface $403 {}
        }
    }
    namespace GetUsers {
        namespace Parameters {
            export type Limit = number;
            export type Query = string;
            export type Start = number;
        }
        export interface QueryParameters {
            query?: Parameters.Query;
            start?: Parameters.Start;
            limit?: Parameters.Limit;
        }
        namespace Responses {
            export type $200 = Components.Schemas.UserListDto;
            export interface $403 {}
        }
    }
    namespace RemoveEmail {
        namespace Responses {
            export interface $204 {}
            export interface $403 {}
        }
    }
    namespace RemoveSkin {
        namespace Responses {
            export interface $204 {}
            export interface $403 {}
        }
    }
    namespace RemoveTotpSecret {
        namespace Responses {
            export interface $204 {}
            export interface $403 {}
        }
    }
    namespace SetEmail {
        export type RequestBody = Components.Schemas.ChangeEmailDto;
        namespace Responses {
            export interface $204 {}
            export interface $403 {}
        }
    }
    namespace SetModpackBundle {
        namespace Parameters {
            export type Id = string;
            export type Version = string;
        }
        export interface PathParameters {
            id: Parameters.Id;
        }
        export interface QueryParameters {
            version: Parameters.Version;
        }
        export interface RequestBody {
            file: string; // binary
        }
        namespace Responses {
            export interface $204 {}
            export interface $400 {}
            export interface $403 {}
            export interface $404 {}
            export interface $409 {}
        }
    }
    namespace SetPassword {
        export type RequestBody = Components.Schemas.ChangePasswordDto;
        namespace Responses {
            export interface $204 {}
            export interface $403 {}
        }
    }
    namespace SetSkin {
        namespace Parameters {
            export type Slim = boolean;
        }
        export interface QueryParameters {
            slim: Parameters.Slim;
        }
        export interface RequestBody {
            file: string; // binary
        }
        namespace Responses {
            export interface $204 {}
            export interface $400 {}
            export interface $403 {}
        }
    }
    namespace SetTotpSecret {
        export type RequestBody = Components.Schemas.ChangeTotpDto;
        namespace Responses {
            export interface $204 {}
            export interface $403 {}
        }
    }
    namespace SetUsername {
        export type RequestBody = Components.Schemas.ChangeUsernameDto;
        namespace Responses {
            export interface $204 {}
            export interface $403 {}
            export interface $409 {}
        }
    }
}

export interface OperationMethods {
    /**
     * createUser
     */
    "createUser"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: Paths.CreateUser.RequestBody,
        config?: AxiosRequestConfig,
    ): OperationResponse<any>;
    /**
     * getUsers
     */
    "getUsers"(
        parameters?: Parameters<Paths.GetUsers.QueryParameters> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetUsers.Responses.$200>;
    /**
     * getProfile
     */
    "getProfile"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetProfile.Responses.$200>;
    /**
     * createAccessToken
     */
    "createAccessToken"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: Paths.CreateAccessToken.RequestBody,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.CreateAccessToken.Responses.$201>;
    /**
     * exchangeAccessToken
     */
    "exchangeAccessToken"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.ExchangeAccessToken.Responses.$201>;
    /**
     * getModpacks
     */
    "getModpacks"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetModpacks.Responses.$200>;
    /**
     * getModpackBundle
     */
    "getModpackBundle"(
        parameters?: Parameters<Paths.GetModpackBundle.PathParameters> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.GetModpackBundle.Responses.$200>;
    /**
     * setModpackBundle
     */
    "setModpackBundle"(
        parameters?: Parameters<
            Paths.SetModpackBundle.QueryParameters
                & Paths.SetModpackBundle.PathParameters
        > | null,
        data?: Paths.SetModpackBundle.RequestBody,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.SetModpackBundle.Responses.$204>;
    /**
     * setEmail
     */
    "setEmail"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: Paths.SetEmail.RequestBody,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.SetEmail.Responses.$204>;
    /**
     * removeEmail
     */
    "removeEmail"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.RemoveEmail.Responses.$204>;
    /**
     * confirmEmail
     */
    "confirmEmail"(
        parameters?: Parameters<Paths.ConfirmEmail.PathParameters> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.ConfirmEmail.Responses.$204>;
    /**
     * setPassword
     */
    "setPassword"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: Paths.SetPassword.RequestBody,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.SetPassword.Responses.$204>;
    /**
     * setSkin
     */
    "setSkin"(
        parameters?: Parameters<Paths.SetSkin.QueryParameters> | null,
        data?: Paths.SetSkin.RequestBody,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.SetSkin.Responses.$204>;
    /**
     * removeSkin
     */
    "removeSkin"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.RemoveSkin.Responses.$204>;
    /**
     * setTotpSecret
     */
    "setTotpSecret"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: Paths.SetTotpSecret.RequestBody,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.SetTotpSecret.Responses.$204>;
    /**
     * removeTotpSecret
     */
    "removeTotpSecret"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: any,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.RemoveTotpSecret.Responses.$204>;
    /**
     * setUsername
     */
    "setUsername"(
        parameters?: Parameters<UnknownParamsObject> | null,
        data?: Paths.SetUsername.RequestBody,
        config?: AxiosRequestConfig,
    ): OperationResponse<Paths.SetUsername.Responses.$204>;
}

export interface PathsDictionary {
    ["/1/sign-ups"]: {
        /**
         * createUser
         */
        "post"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: Paths.CreateUser.RequestBody,
            config?: AxiosRequestConfig,
        ): OperationResponse<any>;
    };
    ["/1/users"]: {
        /**
         * getUsers
         */
        "get"(
            parameters?: Parameters<Paths.GetUsers.QueryParameters> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.GetUsers.Responses.$200>;
    };
    ["/1/profile"]: {
        /**
         * getProfile
         */
        "get"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.GetProfile.Responses.$200>;
    };
    ["/1/access-tokens"]: {
        /**
         * createAccessToken
         */
        "post"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: Paths.CreateAccessToken.RequestBody,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.CreateAccessToken.Responses.$201>;
    };
    ["/1/access-tokens/exchange"]: {
        /**
         * exchangeAccessToken
         */
        "post"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.ExchangeAccessToken.Responses.$201>;
    };
    ["/1/modpacks"]: {
        /**
         * getModpacks
         */
        "get"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.GetModpacks.Responses.$200>;
    };
    ["/1/modpacks/{id}/bundle"]: {
        /**
         * getModpackBundle
         */
        "get"(
            parameters?: Parameters<Paths.GetModpackBundle.PathParameters> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.GetModpackBundle.Responses.$200>;
        /**
         * setModpackBundle
         */
        "put"(
            parameters?: Parameters<
                Paths.SetModpackBundle.QueryParameters
                    & Paths.SetModpackBundle.PathParameters
            > | null,
            data?: Paths.SetModpackBundle.RequestBody,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.SetModpackBundle.Responses.$204>;
    };
    ["/1/profile/email"]: {
        /**
         * setEmail
         */
        "put"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: Paths.SetEmail.RequestBody,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.SetEmail.Responses.$204>;
        /**
         * removeEmail
         */
        "delete"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.RemoveEmail.Responses.$204>;
    };
    ["/1/profile/email/confirmation-codes/{code}"]: {
        /**
         * confirmEmail
         */
        "put"(
            parameters?: Parameters<Paths.ConfirmEmail.PathParameters> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.ConfirmEmail.Responses.$204>;
    };
    ["/1/profile/password"]: {
        /**
         * setPassword
         */
        "put"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: Paths.SetPassword.RequestBody,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.SetPassword.Responses.$204>;
    };
    ["/1/profile/skin"]: {
        /**
         * setSkin
         */
        "put"(
            parameters?: Parameters<Paths.SetSkin.QueryParameters> | null,
            data?: Paths.SetSkin.RequestBody,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.SetSkin.Responses.$204>;
        /**
         * removeSkin
         */
        "delete"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.RemoveSkin.Responses.$204>;
    };
    ["/1/profile/totp"]: {
        /**
         * setTotpSecret
         */
        "put"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: Paths.SetTotpSecret.RequestBody,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.SetTotpSecret.Responses.$204>;
        /**
         * removeTotpSecret
         */
        "delete"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: any,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.RemoveTotpSecret.Responses.$204>;
    };
    ["/1/profile/username"]: {
        /**
         * setUsername
         */
        "put"(
            parameters?: Parameters<UnknownParamsObject> | null,
            data?: Paths.SetUsername.RequestBody,
            config?: AxiosRequestConfig,
        ): OperationResponse<Paths.SetUsername.Responses.$204>;
    };
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>;

export type AccessTokenDto = Components.Schemas.AccessTokenDto;
export type AccessTokenFailDto = Components.Schemas.AccessTokenFailDto;
export type ChangeEmailDto = Components.Schemas.ChangeEmailDto;
export type ChangePasswordDto = Components.Schemas.ChangePasswordDto;
export type ChangeTotpDto = Components.Schemas.ChangeTotpDto;
export type ChangeUsernameDto = Components.Schemas.ChangeUsernameDto;
export type CreateAccessTokenDto = Components.Schemas.CreateAccessTokenDto;
export type CreateUserDto = Components.Schemas.CreateUserDto;
export type ModpackDownloadDto = Components.Schemas.ModpackDownloadDto;
export type ModpackDto = Components.Schemas.ModpackDto;
export type ModpackListDto = Components.Schemas.ModpackListDto;
export type ModpackMaintenanceDto = Components.Schemas.ModpackMaintenanceDto;
export type ProfileDto = Components.Schemas.ProfileDto;
export type UserBanDto = Components.Schemas.UserBanDto;
export type UserDto = Components.Schemas.UserDto;
export type UserListDto = Components.Schemas.UserListDto;
