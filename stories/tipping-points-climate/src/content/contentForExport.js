export const sceneContent = {
    "header-0": "Tipping Points in Climate",
    "description-0": `An interactive visualization to explore how small shifts in key variables can trigger large changes in Earth's climate. 

This simple model with just *three* interacting components demonstrates the principal mechanism behind extreme climatic shifts - the balance between amplifying and stabilizing mechanisms in the climate system.

The modern climate exists in a moderate intermediate state, maintained in large part by the stabilizing role of the climate-biosphere system.`,

    "header-1": "Snowball and Hothouse Earths",
    "description-1": `More than once in Earth's history, the planet was likely completely covered in ice. These are the so-called *Snowball Earth* events that happened during the late Proterozoic and early Cambrian periods, between 700 and 600 million years ago.

There were also extended *Hothouse Earth* periods, characterized by high greenhouse gas concentrations, high temperatures, and little to no ice on the surface.

There are several hypotheses for what caused these events and the research is ongoing. However, regardless of the chain of physical processes that led to these events, they ultimately involved the climate system reaching a *tipping point*.`,

    "header-2": "A pale blue dot",
    "description-2": `To simplify the enormously complex climate system, let's first zoom far out into space from where the Earth only appears as a *pale blue dot*.

From this distance, the Earth is only visible as a few pixels with measureable **brightness** and **color**. We don't see any surface features. But the brightness can tell us how reflective the surface is, and the color can tell us what the average temperature is.

Let us also imagine that we can observe the Earth over very long time periods, spanning millions of years.`,

    "header-3": "Building the model",
    "description-3": `Now we can start building a very simple model of the Earth's climate.

So at the very basic, our climate model will have these processes:
- Incoming energy from the sun, affected by how much ice is present.
- Heat energy radiated back to space, affected by greenhouse gas concentration.
- Ice formation and melting, affected by how much heat energy is there in the system.
- Greenhouse gas concentration. 

In the real world this is affected by many natural (and in the present day human-induced) processes. But for our simple model, we will keep this quantity independent of the other processes. This will in fact allow us to use the greenhouse gas concentration as a knob to control the climate.

Let us now build the model, one piece at a time.`,

    "header-4": "Incoming Energy",
    "description-4": `The total amount of energy that the Earth receives from the sun can be measured by the amount of energy that is intercepted by the Earth's cross-sectional area, *i.e.* the area of Earth's shadow.

Solar energy at Earth's distance is about 1360 Watts per square meter ($S_0$). So the total intercepted energy equals $S_0$ multiplied by Earth's cross-sectional area. 

Ice reflects a fraction (albedo, $\\alpha$) of incoming energy back to space. Total incoming energy is:

$$E_{in} = S_0\\pi R^2 (1-\\alpha)$$

Ice coverage varies uniformly with temperature relative to freezing point.`,

    "header-5": "Outgoing Energy",
    "description-5": `Over geological time, Earth's energy input and output must balance. For an Earth without atmosphere, outgoing energy follows the Stefan-Boltzmann law:

$$E_{out} = \\sigma T^4 \\cdot A $$

With greenhouse gases, the outgoing energy is reduced by concentration (g):

$$E_{out} = \\frac{1}{g}4\\pi R^2 \\sigma T^4, \\textrm {where } g > 0$$`,

    "header-6": "Putting it all together",
    "description-6": `The rate of energy change in the system can now be written as the difference between incoming and outgoing energy:

$$\\frac{dE}{dt}=E_{in} - E_{out} =S_0\\pi R^2 (1-\\alpha(T))-\\frac{1}{g}4\\pi R^2 \\sigma T^4$$

We can relate the temperature change to the energy change by dividing by the heat capacity of the system, $c$

$$c\\frac{dT}{dt}=S_0\\pi R^2 (1-\\alpha(T))-\\frac{1}{g}4\\pi R^2 \\sigma T^4$$

This single ordinary differential equation (ODE) describes the climate model. 

This is the *simplest* possible model of the climate system.`,

    "header-7": "etc",
    "description-7": `some placeholder text`,

    "header-8": "Simulation",
    "description-8": `Use the slider to change the amount of greenhouse gases in the atmosphere.`,

    "header-9": "Summary",
    "description-9": `Earth's climate balances solar input with energy reflection and retention. Ice acts as a positive feedback mechanism - more ice increases energy loss, lowering temperature and creating more ice. This cycle works similarly in reverse. These amplifying trends are ultimately limited by total Earth coverage.`
};