import { useCallback, useMemo, useEffect } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { Checkbox } from "vscrui"

import type { ProviderSettings, ModelInfo } from "@roo-code/types"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@src/components/ui"

interface CustomModelConfigProps {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: <K extends keyof ProviderSettings>(field: K, value: ProviderSettings[K]) => void
	isCustomModel: boolean
}

export const CustomModelConfig = ({
	apiConfiguration,
	setApiConfigurationField,
	isCustomModel,
}: CustomModelConfigProps) => {
	const { t } = useAppTranslation()

	// Get the current custom model info or create defaults
	const customModelInfo: Partial<ModelInfo> = useMemo(() => {
		return apiConfiguration.customModelInfo || {}
	}, [apiConfiguration.customModelInfo])

	// Update a specific field in the custom model info
	const updateCustomModelInfo = useCallback(
		<K extends keyof ModelInfo>(field: K, value: ModelInfo[K]) => {
			const updated = {
				...customModelInfo,
				[field]: value,
			}
			setApiConfigurationField("customModelInfo", updated as ModelInfo)
		},
		[customModelInfo, setApiConfigurationField],
	)

	// Clear custom model info when switching to a predefined model
	useEffect(() => {
		if (!isCustomModel && apiConfiguration.customModelInfo) {
			setApiConfigurationField("customModelInfo", undefined)
		}
	}, [isCustomModel, apiConfiguration.customModelInfo, setApiConfigurationField])

	// Don't render anything if this isn't a custom model
	if (!isCustomModel) {
		return null
	}

	return (
		<Collapsible defaultOpen={true}>
			<CollapsibleTrigger className="flex items-center gap-1 w-full cursor-pointer hover:opacity-80 mb-2">
				<span className="codicon codicon-chevron-down"></span>
				<span className="font-medium">{t("settings:customModelConfig.title")}</span>
			</CollapsibleTrigger>
			<CollapsibleContent className="space-y-3 pl-4 border-l border-vscode-input-border">
				<div className="text-sm text-vscode-descriptionForeground mb-2">
					{t("settings:customModelConfig.description")}
				</div>

				{/* Max Output Tokens */}
				<VSCodeTextField
					value={customModelInfo.maxTokens?.toString() || ""}
					onInput={(e: any) => {
						const value = parseInt(e.target.value, 10)
						updateCustomModelInfo("maxTokens", isNaN(value) ? undefined : value)
					}}
					placeholder={t("settings:placeholders.numbers.maxTokens")}
					className="w-full">
					<label className="block font-medium mb-1">{t("settings:customModelConfig.maxTokens")}</label>
				</VSCodeTextField>
				<div className="text-sm text-vscode-descriptionForeground -mt-2">
					{t("settings:customModelConfig.maxTokensDescription")}
				</div>

				{/* Context Window */}
				<VSCodeTextField
					value={customModelInfo.contextWindow?.toString() || ""}
					onInput={(e: any) => {
						const value = parseInt(e.target.value, 10)
						updateCustomModelInfo("contextWindow", isNaN(value) ? 128000 : value)
					}}
					placeholder={t("settings:placeholders.numbers.contextWindow")}
					className="w-full">
					<label className="block font-medium mb-1">{t("settings:customModelConfig.contextWindow")}</label>
				</VSCodeTextField>
				<div className="text-sm text-vscode-descriptionForeground -mt-2">
					{t("settings:customModelConfig.contextWindowDescription")}
				</div>

				{/* Supports Images Checkbox */}
				<div>
					<Checkbox
						checked={customModelInfo.supportsImages ?? false}
						onChange={(checked: boolean) => updateCustomModelInfo("supportsImages", checked)}>
						{t("settings:customModelConfig.supportsImages")}
					</Checkbox>
					<div className="text-sm text-vscode-descriptionForeground mt-1 ml-6">
						{t("settings:customModelConfig.supportsImagesDescription")}
					</div>
				</div>

				{/* Supports Prompt Cache Checkbox */}
				<div>
					<Checkbox
						checked={customModelInfo.supportsPromptCache ?? false}
						onChange={(checked: boolean) => updateCustomModelInfo("supportsPromptCache", checked)}>
						{t("settings:customModelConfig.supportsPromptCache")}
					</Checkbox>
					<div className="text-sm text-vscode-descriptionForeground mt-1 ml-6">
						{t("settings:customModelConfig.supportsPromptCacheDescription")}
					</div>
				</div>

				{/* Supports Thinking/Reasoning Checkbox */}
				<div>
					<Checkbox
						checked={customModelInfo.supportsReasoningBudget ?? false}
						onChange={(checked: boolean) => updateCustomModelInfo("supportsReasoningBudget", checked)}>
						{t("settings:customModelConfig.supportsThinking")}
					</Checkbox>
					<div className="text-sm text-vscode-descriptionForeground mt-1 ml-6">
						{t("settings:customModelConfig.supportsThinkingDescription")}
					</div>
				</div>

				{/* Input Price */}
				<VSCodeTextField
					value={customModelInfo.inputPrice?.toString() || ""}
					onInput={(e: any) => {
						const value = parseFloat(e.target.value)
						updateCustomModelInfo("inputPrice", isNaN(value) ? undefined : value)
					}}
					placeholder={t("settings:placeholders.numbers.inputPrice")}
					className="w-full">
					<label className="block font-medium mb-1">{t("settings:customModelConfig.inputPrice")}</label>
				</VSCodeTextField>

				{/* Output Price */}
				<VSCodeTextField
					value={customModelInfo.outputPrice?.toString() || ""}
					onInput={(e: any) => {
						const value = parseFloat(e.target.value)
						updateCustomModelInfo("outputPrice", isNaN(value) ? undefined : value)
					}}
					placeholder={t("settings:placeholders.numbers.outputPrice")}
					className="w-full">
					<label className="block font-medium mb-1">{t("settings:customModelConfig.outputPrice")}</label>
				</VSCodeTextField>
			</CollapsibleContent>
		</Collapsible>
	)
}
