import {
	type ProviderName,
	type ProviderSettings,
	type ModelInfo,
	anthropicModels,
	bedrockModels,
	cerebrasModels,
	deepSeekModels,
	moonshotModels,
	minimaxModels,
	geminiModels,
	mistralModels,
	openAiModelInfoSaneDefaults,
	openAiNativeModels,
	vertexModels,
	xaiModels,
	groqModels,
	vscodeLlmModels,
	vscodeLlmDefaultModelId,
	claudeCodeModels,
	sambaNovaModels,
	doubaoModels,
	internationalZAiModels,
	mainlandZAiModels,
	fireworksModels,
	featherlessModels,
	ioIntelligenceModels,
	basetenModels,
	qwenCodeModels,
	BEDROCK_1M_CONTEXT_MODEL_IDS,
	isDynamicProvider,
	getProviderDefaultModelId,
} from "@roo-code/types"

import type { ModelRecord, RouterModels } from "@roo/api"

import { useRouterModels } from "./useRouterModels"
import { useOpenRouterModelProviders } from "./useOpenRouterModelProviders"
import { useLmStudioModels } from "./useLmStudioModels"
import { useOllamaModels } from "./useOllamaModels"

/**
 * Helper to get a validated model ID for dynamic providers.
 * Returns the configured model ID if it's set (even if not in available models - for custom models),
 * otherwise returns the default model ID.
 * Note: Custom models may not be in the available models list, so we should not
 * fall back to default if a model ID is explicitly configured.
 */
function getValidatedModelId(
	configuredId: string | undefined,
	_availableModels: ModelRecord | undefined,
	defaultModelId: string,
): string {
	// If a model ID is explicitly configured, use it (supports custom models)
	if (configuredId) {
		return configuredId
	}
	// Fall back to default only if no model is configured
	return defaultModelId
}

/**
 * Helper to get model info with customModelInfo as fallback for static providers.
 * Returns the predefined model info if available, otherwise falls back to customModelInfo.
 * This ensures custom model IDs not in predefined lists can still have proper model configuration.
 */
function getModelInfoWithCustomFallback(
	predefinedInfo: ModelInfo | undefined,
	customModelInfo: ModelInfo | null | undefined,
): ModelInfo | undefined {
	return predefinedInfo ?? customModelInfo ?? undefined
}

export const useSelectedModel = (apiConfiguration?: ProviderSettings) => {
	const provider = apiConfiguration?.apiProvider || "anthropic"
	const openRouterModelId = provider === "openrouter" ? apiConfiguration?.openRouterModelId : undefined
	const lmStudioModelId = provider === "lmstudio" ? apiConfiguration?.lmStudioModelId : undefined
	const ollamaModelId = provider === "ollama" ? apiConfiguration?.ollamaModelId : undefined

	// Only fetch router models for dynamic providers
	const shouldFetchRouterModels = isDynamicProvider(provider)
	const routerModels = useRouterModels({
		provider: shouldFetchRouterModels ? provider : undefined,
		enabled: shouldFetchRouterModels,
	})

	const openRouterModelProviders = useOpenRouterModelProviders(openRouterModelId)
	const lmStudioModels = useLmStudioModels(lmStudioModelId)
	const ollamaModels = useOllamaModels(ollamaModelId)

	// Compute readiness only for the data actually needed for the selected provider
	const needRouterModels = shouldFetchRouterModels
	const needOpenRouterProviders = provider === "openrouter"
	const needLmStudio = typeof lmStudioModelId !== "undefined"
	const needOllama = typeof ollamaModelId !== "undefined"

	const hasValidRouterData = needRouterModels
		? routerModels.data &&
			routerModels.data[provider] !== undefined &&
			typeof routerModels.data[provider] === "object" &&
			!routerModels.isLoading
		: true

	const isReady =
		(!needLmStudio || typeof lmStudioModels.data !== "undefined") &&
		(!needOllama || typeof ollamaModels.data !== "undefined") &&
		hasValidRouterData &&
		(!needOpenRouterProviders || typeof openRouterModelProviders.data !== "undefined")

	const { id, info } =
		apiConfiguration && isReady
			? getSelectedModel({
					provider,
					apiConfiguration,
					routerModels: (routerModels.data || {}) as RouterModels,
					openRouterModelProviders: (openRouterModelProviders.data || {}) as Record<string, ModelInfo>,
					lmStudioModels: (lmStudioModels.data || undefined) as ModelRecord | undefined,
					ollamaModels: (ollamaModels.data || undefined) as ModelRecord | undefined,
				})
			: { id: getProviderDefaultModelId(provider), info: undefined }

	return {
		provider,
		id,
		info,
		isLoading:
			(needRouterModels && routerModels.isLoading) ||
			(needOpenRouterProviders && openRouterModelProviders.isLoading) ||
			(needLmStudio && lmStudioModels!.isLoading) ||
			(needOllama && ollamaModels!.isLoading),
		isError:
			(needRouterModels && routerModels.isError) ||
			(needOpenRouterProviders && openRouterModelProviders.isError) ||
			(needLmStudio && lmStudioModels!.isError) ||
			(needOllama && ollamaModels!.isError),
	}
}

function getSelectedModel({
	provider,
	apiConfiguration,
	routerModels,
	openRouterModelProviders,
	lmStudioModels,
	ollamaModels,
}: {
	provider: ProviderName
	apiConfiguration: ProviderSettings
	routerModels: RouterModels
	openRouterModelProviders: Record<string, ModelInfo>
	lmStudioModels: ModelRecord | undefined
	ollamaModels: ModelRecord | undefined
}): { id: string; info: ModelInfo | undefined } {
	// the `undefined` case are used to show the invalid selection to prevent
	// users from seeing the default model if their selection is invalid
	// this gives a better UX than showing the default model
	const defaultModelId = getProviderDefaultModelId(provider)
	switch (provider) {
		case "openrouter": {
			const id = getValidatedModelId(apiConfiguration.openRouterModelId, routerModels.openrouter, defaultModelId)
			let info = routerModels.openrouter?.[id]
			const specificProvider = apiConfiguration.openRouterSpecificProvider

			if (specificProvider && openRouterModelProviders[specificProvider]) {
				// Overwrite the info with the specific provider info. Some
				// fields are missing the model info for `openRouterModelProviders`
				// so we need to merge the two.
				info = info
					? { ...info, ...openRouterModelProviders[specificProvider] }
					: openRouterModelProviders[specificProvider]
			}

			// For custom models, fall back to customModelInfo
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "requesty": {
			const id = getValidatedModelId(apiConfiguration.requestyModelId, routerModels.requesty, defaultModelId)
			const info = routerModels.requesty?.[id]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "glama": {
			const id = getValidatedModelId(apiConfiguration.glamaModelId, routerModels.glama, defaultModelId)
			const info = routerModels.glama?.[id]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "unbound": {
			const id = getValidatedModelId(apiConfiguration.unboundModelId, routerModels.unbound, defaultModelId)
			const info = routerModels.unbound?.[id]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "litellm": {
			const id = getValidatedModelId(apiConfiguration.litellmModelId, routerModels.litellm, defaultModelId)
			const info = routerModels.litellm?.[id]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "xai": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = xaiModels[id as keyof typeof xaiModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "groq": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = groqModels[id as keyof typeof groqModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "huggingface": {
			const id = apiConfiguration.huggingFaceModelId ?? "meta-llama/Llama-3.3-70B-Instruct"
			const defaultInfo: ModelInfo = {
				maxTokens: 8192,
				contextWindow: 131072,
				supportsImages: false,
				supportsPromptCache: false,
			}
			return { id, info: getModelInfoWithCustomFallback(defaultInfo, apiConfiguration.customModelInfo) }
		}
		case "chutes": {
			const id = getValidatedModelId(apiConfiguration.apiModelId, routerModels.chutes, defaultModelId)
			const info = routerModels.chutes?.[id]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "baseten": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = basetenModels[id as keyof typeof basetenModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "bedrock": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const baseInfo = bedrockModels[id as keyof typeof bedrockModels]

			// Special case for custom ARN.
			if (id === "custom-arn") {
				return {
					id,
					info: { maxTokens: 5000, contextWindow: 128_000, supportsPromptCache: false, supportsImages: true },
				}
			}

			// Apply 1M context for Claude Sonnet 4 / 4.5 when enabled
			if (BEDROCK_1M_CONTEXT_MODEL_IDS.includes(id as any) && apiConfiguration.awsBedrock1MContext && baseInfo) {
				// Create a new ModelInfo object with updated context window
				const info: ModelInfo = {
					...baseInfo,
					contextWindow: 1_000_000,
				}
				return { id, info }
			}

			return { id, info: getModelInfoWithCustomFallback(baseInfo, apiConfiguration.customModelInfo) }
		}
		case "vertex": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = vertexModels[id as keyof typeof vertexModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "gemini": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = geminiModels[id as keyof typeof geminiModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "deepseek": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = deepSeekModels[id as keyof typeof deepSeekModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "doubao": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = doubaoModels[id as keyof typeof doubaoModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "moonshot": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = moonshotModels[id as keyof typeof moonshotModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "minimax": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = minimaxModels[id as keyof typeof minimaxModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "zai": {
			const isChina = apiConfiguration.zaiApiLine === "china_coding"
			const models = isChina ? mainlandZAiModels : internationalZAiModels
			const defaultModelId = getProviderDefaultModelId(provider, { isChina })
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = models[id as keyof typeof models]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "openai-native": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = openAiNativeModels[id as keyof typeof openAiNativeModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "mistral": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = mistralModels[id as keyof typeof mistralModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "openai": {
			const id = apiConfiguration.openAiModelId ?? ""
			const info = apiConfiguration?.openAiCustomModelInfo ?? openAiModelInfoSaneDefaults
			return { id, info }
		}
		case "ollama": {
			const id = apiConfiguration.ollamaModelId ?? ""
			const info = ollamaModels && ollamaModels[apiConfiguration.ollamaModelId!]

			const adjustedInfo =
				info?.contextWindow &&
				apiConfiguration?.ollamaNumCtx &&
				apiConfiguration.ollamaNumCtx < info.contextWindow
					? { ...info, contextWindow: apiConfiguration.ollamaNumCtx }
					: info

			return {
				id,
				info: adjustedInfo || undefined,
			}
		}
		case "lmstudio": {
			const id = apiConfiguration.lmStudioModelId ?? ""
			const info = lmStudioModels && lmStudioModels[apiConfiguration.lmStudioModelId!]
			return {
				id,
				info: info || undefined,
			}
		}
		case "deepinfra": {
			const id = getValidatedModelId(apiConfiguration.deepInfraModelId, routerModels.deepinfra, defaultModelId)
			const info = routerModels.deepinfra?.[id]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "vscode-lm": {
			const id = apiConfiguration?.vsCodeLmModelSelector
				? `${apiConfiguration.vsCodeLmModelSelector.vendor}/${apiConfiguration.vsCodeLmModelSelector.family}`
				: vscodeLlmDefaultModelId
			const modelFamily = apiConfiguration?.vsCodeLmModelSelector?.family ?? vscodeLlmDefaultModelId
			const info = vscodeLlmModels[modelFamily as keyof typeof vscodeLlmModels]
			return { id, info: { ...openAiModelInfoSaneDefaults, ...info, supportsImages: false } } // VSCode LM API currently doesn't support images.
		}
		case "claude-code": {
			// Claude Code models extend anthropic models but with images and prompt caching disabled
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = claudeCodeModels[id as keyof typeof claudeCodeModels]
			const baseInfo = getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo)
			return { id, info: baseInfo ? { ...openAiModelInfoSaneDefaults, ...baseInfo } : undefined }
		}
		case "cerebras": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = cerebrasModels[id as keyof typeof cerebrasModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "sambanova": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = sambaNovaModels[id as keyof typeof sambaNovaModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "fireworks": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = fireworksModels[id as keyof typeof fireworksModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "featherless": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = featherlessModels[id as keyof typeof featherlessModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "io-intelligence": {
			const id = getValidatedModelId(
				apiConfiguration.ioIntelligenceModelId,
				routerModels["io-intelligence"],
				defaultModelId,
			)
			const info =
				routerModels["io-intelligence"]?.[id] ?? ioIntelligenceModels[id as keyof typeof ioIntelligenceModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "roo": {
			const id = getValidatedModelId(apiConfiguration.apiModelId, routerModels.roo, defaultModelId)
			const info = routerModels.roo?.[id]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "qwen-code": {
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const info = qwenCodeModels[id as keyof typeof qwenCodeModels]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		case "vercel-ai-gateway": {
			const id = getValidatedModelId(
				apiConfiguration.vercelAiGatewayModelId,
				routerModels["vercel-ai-gateway"],
				defaultModelId,
			)
			const info = routerModels["vercel-ai-gateway"]?.[id]
			return { id, info: getModelInfoWithCustomFallback(info, apiConfiguration.customModelInfo) }
		}
		// case "anthropic":
		// case "human-relay":
		// case "fake-ai":
		default: {
			provider satisfies "anthropic" | "gemini-cli" | "qwen-code" | "human-relay" | "fake-ai"
			const id = apiConfiguration.apiModelId ?? defaultModelId
			const baseInfo = anthropicModels[id as keyof typeof anthropicModels]

			// Apply 1M context beta tier pricing for Claude Sonnet 4
			if (
				provider === "anthropic" &&
				(id === "claude-sonnet-4-20250514" || id === "claude-sonnet-4-5") &&
				apiConfiguration.anthropicBeta1MContext &&
				baseInfo
			) {
				// Type assertion since we know claude-sonnet-4-20250514 and claude-sonnet-4-5 have tiers
				const modelWithTiers = baseInfo as typeof baseInfo & {
					tiers?: Array<{
						contextWindow: number
						inputPrice?: number
						outputPrice?: number
						cacheWritesPrice?: number
						cacheReadsPrice?: number
					}>
				}
				const tier = modelWithTiers.tiers?.[0]
				if (tier) {
					// Create a new ModelInfo object with updated values
					const info: ModelInfo = {
						...baseInfo,
						contextWindow: tier.contextWindow,
						inputPrice: tier.inputPrice ?? baseInfo.inputPrice,
						outputPrice: tier.outputPrice ?? baseInfo.outputPrice,
						cacheWritesPrice: tier.cacheWritesPrice ?? baseInfo.cacheWritesPrice,
						cacheReadsPrice: tier.cacheReadsPrice ?? baseInfo.cacheReadsPrice,
					}
					return { id, info }
				}
			}

			return { id, info: getModelInfoWithCustomFallback(baseInfo, apiConfiguration.customModelInfo) }
		}
	}
}
