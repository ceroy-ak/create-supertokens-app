import { FILTER_CHOICES_STRATEGY, PromptListChoice, UIBuildType, UserFlags } from "./types.js";

type StrategyObject = Record<
    FILTER_CHOICES_STRATEGY,
    (choices: PromptListChoice[], flag: UserFlags) => Promise<PromptListChoice[]>
>;
/**
 * An object containing strategies for filtering choices based on different criteria.
 * Each strategy is an asynchronous function that takes an array of choices and a flags object,
 * and returns a filtered array of choices.
 *
 * @type {StrategyObject}
 *
 * @property {Function} [FILTER_CHOICES_STRATEGY.UI_BUILD_FRONTEND] - Filters choices based on the frontend UI build type.
 * If the `uibuild` flag is set to `PRE_BUILT`, it returns the original choices.
 * Otherwise, it filters the choices to include only those frontend which have the BoilerPlate for Custom UI.
 *
 * @property {Function} [FILTER_CHOICES_STRATEGY.UI_BUILD_RECIPE] - Filters choices based on the recipe UI build type.
 * If the `uibuild` flag is set to `PRE_BUILT`, it returns the original choices.
 * Otherwise, it filters the choices to include only those frontend which have the BoilerPlate for Custom UI.
 *
 * @param {Array} choices - The array of choices to be filtered.
 * @param {Object} flags - An object containing flags that determine the filtering criteria.
 * @returns {Promise<Array>} A promise that resolves to the filtered array of choices.
 */
const STRATEGIES: StrategyObject = {
    /**
     * Filters choices based on the frontend UI build type.
     */
    [FILTER_CHOICES_STRATEGY.UI_BUILD_FRONTEND]: async (choices, flags) => {
        if (flags.uibuild === UIBuildType.PRE_BUILT) {
            return choices;
        }
        const SUPPORTED_FRONTENDS_CUSTOM_UI = ["react"];
        return choices.filter((choice) => SUPPORTED_FRONTENDS_CUSTOM_UI.includes(choice.value));
    },
    /**
     * Filters choices based on the recipe UI build type.
     */
    [FILTER_CHOICES_STRATEGY.UI_BUILD_RECIPE]: async (choices, flags) => {
        if (flags.uibuild === UIBuildType.PRE_BUILT) {
            return choices;
        }
        if (flags.frontend !== "react") {
            throw new Error("No Recipes Available for the selected UI Build Type and Frontend");
        }
        const SUPPORTED_RECIPES_CUSTOM_UI = ["emailpassword", "thirdpartyemailpassword"];
        return choices.filter((choice) => SUPPORTED_RECIPES_CUSTOM_UI.includes(choice.value));
    },
};

/**
 * Filters a list of choices based on the provided strategy or strategies.
 *
 * @param {UserFlags} flags - The user flags that may influence the filtering process.
 * @returns {Function} A function that takes a list of choices (or a promise that resolves to a list of choices)
 * and an optional strategy (or strategies) for filtering the choices. The function returns a promise that resolves
 * to the filtered list of choices.
 *
 * The strategy can be:
 * - A single strategy from `FILTER_CHOICES_STRATEGY`.
 * - An array of strategies from `FILTER_CHOICES_STRATEGY`.
 * - A custom function that takes a list of choices and returns a promise that resolves to a filtered list of choices.
 *
 * If no strategy is provided, or if the provided strategy is an empty array, the original list of choices is returned.
 * If the strategy is a function, it is called with the list of choices.
 * If the strategy is an array, each strategy in the array is applied sequentially.
 *
 * @example
 * const filteredChoices = await filterChoices(userFlags)(choices, [strategy1, strategy2]);
 */
export const filterChoices =
    (flags: UserFlags) =>
    async (
        choices: PromptListChoice[] | Promise<PromptListChoice[]>,
        strategy?:
            | FILTER_CHOICES_STRATEGY
            | FILTER_CHOICES_STRATEGY[]
            | ((choices: PromptListChoice[]) => Promise<PromptListChoice[]>)
    ): Promise<PromptListChoice[]> => {
        if (choices instanceof Promise) {
            choices = await choices;
        }
        if (!strategy || (Array.isArray(strategy) && strategy.length === 0)) {
            return choices;
        }
        if (typeof strategy === "function") {
            return strategy(choices);
        }
        if (!Array.isArray(strategy)) {
            strategy = [strategy];
        }
        for (const filter of strategy) {
            if (!STRATEGIES[filter]) {
                continue;
            }
            choices = await STRATEGIES[filter](choices, flags);
        }
        return choices;
    };
