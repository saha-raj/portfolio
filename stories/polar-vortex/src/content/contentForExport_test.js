export const sceneContent = {
    "header-0": "Tipping Points in Climate",
    "description-0": `An interactive visualization exploring how small shifts in key variables can trigger large changes in Earth's climate. 

This simple model with just *three* interacting components demonstrates the mechanisms behind extreme climatic shifts - the interplay between amplifying mechanisms and braking mechanisms in the climate system.

The modern climate exists in a moderate intermediate state, maintained by the negative feedbacks from the climate-biosphere system.`,

    "header-1": "A pale blue dot",
    "description-1": `The climate system is driven by solar energy input, energy stored in land, air, and water, and energy radiated to space. Viewed from space over geological time, Earth's appearance has changed dramatically - from complete ice coverage to periods without polar ice caps. These shifts occurred through positive feedbacks overwhelming negative feedbacks.`,

    "header-2": "The simplest model",
    "description-2": `Our model has three mechanisms: energy flux, energy storage in the atmosphere and ocean, and surface ice reflectivity. Temperature connects these mechanisms through:

- Temperature-dependent ice growth
- Uniform global ice distribution
- Fixed greenhouse gas effects on energy retention`,

    "header-3": "Incoming Energy",
    "description-3": `Solar energy at Earth's distance is about 1360 Watts per square meter ($S_0$). Total intercepted energy equals $S_0$ multiplied by Earth's cross-sectional area. 

Ice reflects a fraction (albedo, $\\alpha$) of incoming energy back to space. Total incoming energy is:

$$E_{in} = S_0\\pi R^2 (1-\\alpha)$$

Ice coverage varies uniformly with temperature relative to freezing point.`,

    "header-4": "Outgoing Energy",
    "description-4": `Over geological time, Earth's energy input and output must balance. For an Earth without atmosphere, outgoing energy follows the Stefan-Boltzmann law:

$$E_{out} = \\sigma T^4 \\cdot A $$

With greenhouse gases, the outgoing energy is reduced by concentration (g):

$$E_{out} = \\frac{1}{g}4\\pi R^2 \\sigma T^4, \\textrm {where } g > 0$$`,

    "header-5": "The Simplest Climate Model",
    "description-5": `The rate of energy change in the system is:

$$\\frac{dE}{dt}=E_{in} - E_{out} =S_0\\pi R^2 (1-\\alpha(T))-\\frac{1}{g}4\\pi R^2 \\sigma T^4$$

Converting to temperature change:

$$c\\frac{dT}{dt}=S_0\\pi R^2 (1-\\alpha(T))-\\frac{1}{g}4\\pi R^2 \\sigma T^4$$

This '1-dimensional climate model' uses temperature as its sole dynamic variable, connecting radiative loss, ice-albedo effect, and greenhouse effect.`,

    "header-6": "etc",
    "description-6": `some placeholder text`,

    "header-7": "Simulation",
    "description-7": `Use the slider to change the amount of greenhouse gases in the atmosphere.`,

    "header-8": "Summary",
    "description-8": `Earth's climate balances solar input with energy reflection and retention. Ice acts as a positive feedback mechanism - more ice increases energy loss, lowering temperature and creating more ice. This cycle works similarly in reverse. These amplifying trends are ultimately limited by total Earth coverage.`
};