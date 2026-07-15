package com.scrymechat.android.data.local.converters

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.scrymechat.android.data.remote.AttachmentDto
import com.scrymechat.android.data.remote.ReactionGroupDto
import com.scrymechat.android.data.local.entities.ForwardedSnapshot

class DatabaseConverters {
    private val gson = Gson()

    @TypeConverter
    fun fromAttachmentList(value: List<AttachmentDto>?): String? {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toAttachmentList(value: String?): List<AttachmentDto>? {
        val listType = object : TypeToken<List<AttachmentDto>>() {}.type
        return gson.fromJson(value, listType)
    }

    @TypeConverter
    fun fromMetadataMap(value: Map<String, Any>?): String? {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toMetadataMap(value: String?): Map<String, Any>? {
        val mapType = object : TypeToken<Map<String, Any>>() {}.type
        return gson.fromJson(value, mapType)
    }

    @TypeConverter
    fun fromReactionGroupList(value: List<ReactionGroupDto>?): String? {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toReactionGroupList(value: String?): List<ReactionGroupDto>? {
        val listType = object : TypeToken<List<ReactionGroupDto>>() {}.type
        return gson.fromJson(value, listType)
    }

    @TypeConverter
    fun fromForwardedSnapshotList(value: List<ForwardedSnapshot>?): String? {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toForwardedSnapshotList(value: String?): List<ForwardedSnapshot>? {
        val listType = object : TypeToken<List<ForwardedSnapshot>>() {}.type
        return gson.fromJson(value, listType)
    }
}
