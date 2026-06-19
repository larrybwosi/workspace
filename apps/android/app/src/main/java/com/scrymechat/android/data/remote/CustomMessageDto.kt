package com.scrymechat.android.data.remote

data class CustomMessageDto(
    val version: String = "v1",
    val templateId: String? = null,
    val type: String,
    val context: CustomMessageContext,
    val root: MessageNodeDto,
    val actions: List<MessageActionDto>? = null,
    val data: Map<String, Any>? = null,
    val constraints: MessageConstraintsDto? = null
)

data class CustomMessageContext(
    val title: String,
    val description: String? = null,
    val icon: String? = null,
    val color: String? = null,
    val priority: String = "normal"
)

data class MessageNodeDto(
    val type: String,
    val id: String? = null,
    val properties: Map<String, Any>? = null,
    val children: List<MessageNodeDto>? = null,
    val condition: MessageConditionDto? = null,
    val validation: MessageValidationDto? = null,
    val metadata: Map<String, Any>? = null
)

data class MessageConditionDto(
    val field: String,
    val operator: String,
    val value: Any? = null
)

data class MessageValidationDto(
    val required: Boolean? = null,
    val pattern: String? = null,
    val minLength: Int? = null,
    val maxLength: Int? = null,
    val min: Double? = null,
    val max: Double? = null,
    val errorMessage: String? = null
)

data class MessageActionDto(
    val id: String,
    val label: String,
    val type: String = "SECONDARY",
    val icon: String? = null,
    val handler: MessageActionHandlerDto,
    val condition: MessageConditionDto? = null
)

data class MessageActionHandlerDto(
    val type: String,
    val url: String? = null,
    val callbackId: String? = null,
    val payload: Map<String, Any>? = null,
    val includeFormState: Boolean = true
)

data class MessageConstraintsDto(
    val targetUsers: List<String>? = null,
    val requiresPermissions: List<String>? = null,
    val expiresAt: String? = null
)
