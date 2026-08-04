import logging

from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def get_weather(location: str) -> str:
    """Get the current weather forecast and conditions for a specific location. Use this when the farmer asks about weather."""
    logger.info(f"Tool called: get_weather for {location}")
    # Mock data to ensure it never crashes
    try:
        return f"Weather in {location}: 28°C, Mostly sunny. Slight chance of rain in the evening."
    except Exception as e:
        logger.error(f"Weather tool failed: {e}")
        return "Weather service is currently unavailable."


@tool
def get_market_prices(crop: str, location: str) -> str:
    """Get the current market prices for a specific crop in a given location. Use this when the farmer asks about prices or selling their crop."""
    logger.info(f"Tool called: get_market_prices for {crop} in {location}")
    try:
        return f"Current market price for {crop} in {location} is around ₹2400 - ₹2600 per quintal. Demand is steady."
    except Exception as e:
        logger.error(f"Market prices tool failed: {e}")
        return "Market price service is currently unavailable."


@tool
def get_government_schemes(topic: str) -> str:
    """Get information about government schemes related to agriculture (e.g., subsidies, insurance, soil cards). Use this when the farmer asks about government help or schemes."""
    logger.info(f"Tool called: get_government_schemes for {topic}")
    try:
        return f"Relevant Scheme for {topic}: The government provides up to 50% subsidy under the PM Krishi Sinchayee Yojana for irrigation equipment."
    except Exception as e:
        logger.error(f"Government schemes tool failed: {e}")
        return "Government scheme service is currently unavailable."


# List of all available tools to bind to the LLM
AVAILABLE_TOOLS = [get_weather, get_market_prices, get_government_schemes]
