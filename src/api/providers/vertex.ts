import { type ModelInfo, type VertexModelId, vertexDefaultModelId, vertexModels } from "@roo-code/types"

import type { ApiHandlerOptions } from "../../shared/api"

import { getModelParams } from "../transform/model-params"

import { GeminiHandler } from "./gemini"
import { SingleCompletionHandler } from "../index"

export class VertexHandler extends GeminiHandler implements SingleCompletionHandler {
	constructor(options: ApiHandlerOptions) {
		super({ ...options, isVertex: true })
	}

	override getModel() {
		const modelId = this.options.apiModelId

		// Check if this is a known model or a custom model
		const isKnownModel = modelId && modelId in vertexModels
		let id: string = modelId || vertexDefaultModelId
		let info: ModelInfo

		if (isKnownModel) {
			info = vertexModels[id as VertexModelId]
		} else if (this.options.customModelInfo) {
			info = {
				...this.options.customModelInfo,
				contextWindow: this.options.customModelInfo.contextWindow || 128000,
				supportsPromptCache: this.options.customModelInfo.supportsPromptCache ?? true,
			}
		} else if (modelId) {
			// Custom model ID without customModelInfo - use sensible defaults
			info = {
				maxTokens: 8192,
				contextWindow: 128000,
				supportsPromptCache: true,
				supportsImages: true,
				supportsNativeTools: true,
			}
		} else {
			id = vertexDefaultModelId
			info = vertexModels[id as VertexModelId]
		}

		const params = getModelParams({ format: "gemini", modelId: id, model: info, settings: this.options })

		// The `:thinking` suffix indicates that the model is a "Hybrid"
		// reasoning model and that reasoning is required to be enabled.
		// The actual model ID honored by Gemini's API does not have this
		// suffix.
		return { id: id.endsWith(":thinking") ? id.replace(":thinking", "") : id, info, ...params }
	}
}
