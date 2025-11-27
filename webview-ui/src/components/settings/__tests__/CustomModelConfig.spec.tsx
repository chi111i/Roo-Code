// npx vitest src/components/settings/__tests__/CustomModelConfig.spec.tsx

import { screen, render } from "@/utils/test-utils"
import { act } from "react"

import { CustomModelConfig } from "../CustomModelConfig"

vi.mock("@src/context/ExtensionStateContext", () => ({
	useExtensionState: vi.fn(),
}))

describe("CustomModelConfig", () => {
	const mockSetApiConfigurationField = vi.fn()

	const defaultProps = {
		apiConfiguration: {},
		setApiConfigurationField: mockSetApiConfigurationField,
		isCustomModel: true,
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("renders nothing when isCustomModel is false", async () => {
		await act(async () => {
			render(<CustomModelConfig {...defaultProps} isCustomModel={false} />)
		})

		// The component should not render when isCustomModel is false
		// The trigger button has the title text, so nothing should be in document
		expect(screen.queryByText(/customModelConfig\.title/i)).not.toBeInTheDocument()
	})

	it("renders the configuration form when isCustomModel is true", async () => {
		await act(async () => {
			render(<CustomModelConfig {...defaultProps} />)
		})

		// The component should render when isCustomModel is true
		// Using the translation key pattern since mock returns keys
		expect(screen.getByText(/customModelConfig\.title/i)).toBeInTheDocument()
	})

	it("displays existing custom model info values", async () => {
		const propsWithExistingConfig = {
			...defaultProps,
			apiConfiguration: {
				customModelInfo: {
					maxTokens: 16384,
					contextWindow: 256000,
					supportsImages: true,
					supportsPromptCache: true,
				},
			},
		}

		await act(async () => {
			render(<CustomModelConfig {...propsWithExistingConfig} />)
		})

		// Check that the values are displayed in the form
		const maxTokensInputs = screen.getAllByDisplayValue("16384")
		expect(maxTokensInputs.length).toBeGreaterThan(0)

		const contextWindowInputs = screen.getAllByDisplayValue("256000")
		expect(contextWindowInputs.length).toBeGreaterThan(0)
	})

	it("clears customModelInfo when switching from custom to predefined model", async () => {
		const propsWithExistingConfig = {
			...defaultProps,
			apiConfiguration: {
				customModelInfo: {
					maxTokens: 16384,
					contextWindow: 256000,
					supportsPromptCache: true,
				},
			},
		}

		const { rerender } = render(<CustomModelConfig {...propsWithExistingConfig} />)

		// Simulate switching to a predefined model
		await act(async () => {
			rerender(<CustomModelConfig {...propsWithExistingConfig} isCustomModel={false} />)
		})

		expect(mockSetApiConfigurationField).toHaveBeenCalledWith("customModelInfo", undefined)
	})
})
