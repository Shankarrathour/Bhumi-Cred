from fastapi import APIRouter, Depends
from app.dependencies.auth import VerifiedFarmer
from app.schemas.checkout import CheckoutRequest, CheckoutSummaryResponse
from app.services.checkout import CheckoutService
from app.repositories.cart import CartRepository
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository

router = APIRouter(prefix="/checkout", tags=["Checkout"])

def get_checkout_service() -> CheckoutService:
    cart_repo = CartRepository()
    product_repo = ProductRepository()
    category_repo = CategoryRepository()
    return CheckoutService(cart_repo, product_repo, category_repo)

@router.post("", response_model=CheckoutSummaryResponse)
async def prepare_checkout(
    data: CheckoutRequest,
    farmer: VerifiedFarmer,
    service: CheckoutService = Depends(get_checkout_service)
):
    """
    Validate the current cart and prepare a checkout summary.
    """
    return await service.prepare_checkout(str(farmer.id), data)
