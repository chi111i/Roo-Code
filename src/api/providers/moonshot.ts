import OpenAI from "openai"
import { moonshotModels, moonshotDefaultModelId, type ModelInfo } from "@roo-code/types"

import type { ApiHandlerOptions } from "../../shared/api"

import type { ApiStreamUsageChunk } from "../transform/stream"
import { getModelParams } from "../transform/model-params"

import { OpenAiHandler } from "./openai"

export class MoonshotHandler extends OpenAiHandler {
	constructor(options: ApiHandlerOptions) {
		super({
			...options,
			openAiApiKey: options.moonshotApiKey ?? "not-provided",
			openAiModelId: options.apiModelId ?? moonshotDefaultModelId,
			openAiBaseUrl: options.moonshotBaseUrl ?? "https://api.moonshot.ai/v1",
			openAiStreamingEnabled: true,
			includeMaxTokens: true,
		})
	}

	override getModel() {
		const modelId = this.options.apiModelId ?? moonshotDefaultModelId

		// Check if this is a known model or a custom model
		const isKnownModel = modelId in moonshotModels
		const id = modelId
		let info

		if (isKnownModel) {
			info = moonshotModels[modelId as keyof typeof moonshotModels]
		} else if (this.options.customModelInfo) {
			info = {
				...this.options.customModelInfo,
				contextWindow: this.options.customModelInfo.contextWindow || 128000,
				supportsPromptCache: this.options.customModelInfo.supportsPromptCache ?? true,
			}
		} else {
			// Custom model ID without customModelInfo - use sensible defaults
			info = {
				maxTokens: 8192,
				contextWindow: 128000,
				supportsPromptCache: true,
				supportsImages: true,
			}
		}

		const params = getModelParams({ format: "openai", modelId: id, model: info, settings: this.options })
		return { id, info, ...params }
	}

	// Override to handle Moonshot's usage metrics, including caching.
	protected override processUsageMetrics(usage: any): ApiStreamUsageChunk {
		return {
			type: "usage",
			inputTokens: usage?.prompt_tokens || 0,
			outputTokens: usage?.completion_tokens || 0,
			cacheWriteTokens: 0,
			cacheReadTokens: usage?.cached_tokens,
		}
	}

	// Override to always include max_tokens for Moonshot (not max_completion_tokens)
	protected override addMaxTokensIfNeeded(
		requestOptions:
			| OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming
			| OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
		modelInfo: ModelInfo,
	): void {
		// Moonshot uses max_tokens instead of max_completion_tokens
		requestOptions.max_tokens = this.options.modelMaxTokens || modelInfo.maxTokens
	}
}
