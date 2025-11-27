import { OpenAiHandler } from "./openai"
import type { ApiHandlerOptions } from "../../shared/api"
import { DOUBAO_API_BASE_URL, doubaoDefaultModelId, doubaoModels } from "@roo-code/types"
import { getModelParams } from "../transform/model-params"
import { ApiStreamUsageChunk } from "../transform/stream"

// Core types for Doubao API
interface ChatCompletionMessageParam {
	role: "system" | "user" | "assistant" | "developer"
	content:
		| string
		| Array<{
				type: "text" | "image_url"
				text?: string
				image_url?: { url: string }
		  }>
}

interface ChatCompletionParams {
	model: string
	messages: ChatCompletionMessageParam[]
	temperature?: number
	stream?: boolean
	stream_options?: { include_usage: boolean }
	max_completion_tokens?: number
}

interface ChatCompletion {
	choices: Array<{
		message: {
			content: string
		}
	}>
	usage?: {
		prompt_tokens: number
		completion_tokens: number
	}
}

interface ChatCompletionChunk {
	choices: Array<{
		delta: {
			content?: string
		}
	}>
	usage?: {
		prompt_tokens: number
		completion_tokens: number
	}
}

export class DoubaoHandler extends OpenAiHandler {
	constructor(options: ApiHandlerOptions) {
		super({
			...options,
			openAiApiKey: options.doubaoApiKey ?? "not-provided",
			openAiModelId: options.apiModelId ?? doubaoDefaultModelId,
			openAiBaseUrl: options.doubaoBaseUrl ?? DOUBAO_API_BASE_URL,
			openAiStreamingEnabled: true,
			includeMaxTokens: true,
		})
	}

	override getModel() {
		const modelId = this.options.apiModelId ?? doubaoDefaultModelId

		// Check if this is a known model or a custom model
		const isKnownModel = modelId in doubaoModels
		const id = modelId
		let info

		if (isKnownModel) {
			info = doubaoModels[modelId as keyof typeof doubaoModels]
		} else if (this.options.customModelInfo) {
			info = {
				...this.options.customModelInfo,
				contextWindow: this.options.customModelInfo.contextWindow || 128000,
				supportsPromptCache: this.options.customModelInfo.supportsPromptCache ?? true,
			}
		} else {
			// Custom model ID without customModelInfo - use sensible defaults
			info = {
				maxTokens: 4096,
				contextWindow: 128000,
				supportsPromptCache: true,
				supportsImages: true,
			}
		}

		const params = getModelParams({ format: "openai", modelId: id, model: info, settings: this.options })
		return { id, info, ...params }
	}

	// Override to handle Doubao's usage metrics, including caching.
	protected override processUsageMetrics(usage: any): ApiStreamUsageChunk {
		return {
			type: "usage",
			inputTokens: usage?.prompt_tokens || 0,
			outputTokens: usage?.completion_tokens || 0,
			cacheWriteTokens: usage?.prompt_tokens_details?.cache_miss_tokens,
			cacheReadTokens: usage?.prompt_tokens_details?.cached_tokens,
		}
	}
}
