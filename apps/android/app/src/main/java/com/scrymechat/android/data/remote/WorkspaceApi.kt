package com.scrymechat.android.data.remote

import retrofit2.Response
import retrofit2.http.*

interface WorkspaceApi {
    @GET("workspaces")
    suspend fun getWorkspaces(): Response<List<WorkspaceDto>>

    @POST("workspaces")
    suspend fun createWorkspace(@Body request: CreateWorkspaceRequest): Response<WorkspaceDto>

    @GET("workspaces/discover")
    suspend fun discoverWorkspaces(
        @retrofit2.http.Query("q") query: String? = null
    ): Response<List<WorkspaceDto>>

    @POST("workspaces/{slug}/join")
    suspend fun joinWorkspace(@Path("slug") slug: String): Response<WorkspaceMemberDto>

    @GET("workspaces/{slug}")
    suspend fun getWorkspaceBySlug(@Path("slug") slug: String): Response<WorkspaceDto>

    @PATCH("workspaces/{slug}")
    suspend fun updateWorkspace(
        @Path("slug") slug: String,
        @Body request: UpdateWorkspaceRequest
    ): Response<WorkspaceDto>

    @DELETE("workspaces/{slug}")
    suspend fun deleteWorkspace(@Path("slug") slug: String): Response<Unit>

    @GET("workspaces/{slug}/members")
    suspend fun getWorkspaceMembers(
        @Path("slug") slug: String
    ): Response<WorkspaceMembersResponse>
}

data class WorkspaceMembersResponse(
    val members: List<WorkspaceMemberWithUserDto>
)

data class WorkspaceMemberWithUserDto(
    val id: String,
    val workspaceId: String,
    val userId: String,
    val role: String,
    val user: UserDto
)
