from typing import List, Dict, Any
from app.config.settings import settings

class PricingService:
    @staticmethod
    def calculate_item_subtotal(price: float, quantity: int) -> float:
        return price * quantity

    @staticmethod
    def calculate_item_discount(original_price: float, price: float, quantity: int) -> float:
        return (original_price - price) * quantity

    @staticmethod
    def calculate_subtotal(items: List[Dict[str, Any]]) -> float:
        return sum(PricingService.calculate_item_subtotal(item['price'], item['quantity']) for item in items)

    @staticmethod
    def calculate_discount(items: List[Dict[str, Any]]) -> float:
        return sum(PricingService.calculate_item_discount(item.get('original_price', item['price']), item['price'], item['quantity']) for item in items)

    @staticmethod
    def calculate_grand_total(subtotal: float) -> float:
        return subtotal

    @staticmethod
    def calculate_delivery_charge(grand_total: float) -> float:
        return 0.0 if grand_total >= settings.FREE_DELIVERY_THRESHOLD else settings.DELIVERY_CHARGE

    @staticmethod
    def calculate_final_total(grand_total: float, delivery_charge: float, discount: float = 0.0) -> float:
        return max(0.0, grand_total + delivery_charge - discount)

    @staticmethod
    def calculate_pricing_summary(items: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Accepts a list of dictionaries, each containing:
        - 'price': float
        - 'original_price': float
        - 'quantity': int
        """
        total_items = sum(item['quantity'] for item in items)
        subtotal = PricingService.calculate_subtotal(items)
        discount = PricingService.calculate_discount(items)
        grand_total = PricingService.calculate_grand_total(subtotal)
        delivery_charge = PricingService.calculate_delivery_charge(grand_total)
        final_total = PricingService.calculate_final_total(grand_total, delivery_charge, discount)

        return {
            "total_items": total_items,
            "subtotal": subtotal,
            "discount": discount,
            "grand_total": grand_total,
            "delivery_charge": delivery_charge,
            "final_total": final_total,
        }
