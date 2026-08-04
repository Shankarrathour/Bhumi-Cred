from app.core.enums import OrderStatus

class OrderStatusValidator:
    """
    Centralized validation for order lifecycle transitions.
    """
    
    @staticmethod
    def can_cancel(status: OrderStatus) -> bool:
        return status == OrderStatus.PENDING

    @staticmethod
    def can_confirm(status: OrderStatus) -> bool:
        return status == OrderStatus.PENDING

    @staticmethod
    def can_process(status: OrderStatus) -> bool:
        return status == OrderStatus.CONFIRMED

    @staticmethod
    def can_pack(status: OrderStatus) -> bool:
        return status == OrderStatus.PROCESSING

    @staticmethod
    def can_ship(status: OrderStatus) -> bool:
        return status == OrderStatus.PACKED

    @staticmethod
    def can_deliver(status: OrderStatus) -> bool:
        return status == OrderStatus.SHIPPED

    @staticmethod
    def can_return(status: OrderStatus) -> bool:
        return status == OrderStatus.DELIVERED

    @staticmethod
    def can_refund(status: OrderStatus) -> bool:
        return status in [OrderStatus.CANCELLED, OrderStatus.RETURNED]

    @staticmethod
    def is_valid_transition(current_status: OrderStatus, new_status: OrderStatus) -> bool:
        """
        Validates if moving from current_status to new_status is allowed.
        """
        if new_status == OrderStatus.CANCELLED:
            return OrderStatusValidator.can_cancel(current_status)
        if new_status == OrderStatus.CONFIRMED:
            return OrderStatusValidator.can_confirm(current_status)
        if new_status == OrderStatus.PROCESSING:
            return OrderStatusValidator.can_process(current_status)
        if new_status == OrderStatus.PACKED:
            return OrderStatusValidator.can_pack(current_status)
        if new_status == OrderStatus.SHIPPED:
            return OrderStatusValidator.can_ship(current_status)
        if new_status == OrderStatus.DELIVERED:
            return OrderStatusValidator.can_deliver(current_status)
        if new_status == OrderStatus.RETURNED:
            return OrderStatusValidator.can_return(current_status)
            
        return False
