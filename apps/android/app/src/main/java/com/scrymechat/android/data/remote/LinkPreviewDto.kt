package com.scrymechat.android.data.remote

import com.google.gson.annotations.SerializedName

data class LinkPreviewDto(
    @SerializedName("title") val title: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("image") val image: String? = null,
    @SerializedName("siteName") val siteName: String? = null,
    @SerializedName("url") val url: String
)
