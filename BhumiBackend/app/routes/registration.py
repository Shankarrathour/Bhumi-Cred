from fastapi import APIRouter, Depends, File, Form, UploadFile, status, Request
from typing import Optional
import base64
import uuid
from pathlib import Path

from app.config.settings import settings
from app.dependencies.auth import CurrentFarmer
from app.dependencies.services import get_registration_service
from app.schemas.common import SuccessResponse
from app.schemas.registration import (
    Step1Request, Step2Request, Step3Request, Step4Request, StepPhotosRequest,
    PhotoUploadBase64Request, RegistrationPhotoUploadResponse,
    Step5Request, Step6Request, Step4Response, InvoiceResponse, SubmitRegistrationResponse, RegistrationResponse
)
from app.services.registration import BhumiCredRegistrationService
from app.utils.upload import upload_file, ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES

router = APIRouter(prefix="/registration", tags=["BhumiCred Registry Registration"])

@router.post(
    "/upload-photo",
    response_model=SuccessResponse[RegistrationPhotoUploadResponse],
    summary="Upload Land Photo for Registration (Multipart or Base64)",
)
async def upload_registration_photo(
    request: Request,
) -> SuccessResponse[RegistrationPhotoUploadResponse]:
    content_type = request.headers.get("content-type", "")
    url = ""
    if "multipart/form-data" in content_type:
        form = await request.form()
        file_obj = form.get("file")
        if file_obj and hasattr(file_obj, "read"):
            url = await upload_file(
                file_obj,
                folder="farmers/land_photos",
                allowed_types=ALLOWED_IMAGE_TYPES,
                max_bytes=MAX_PHOTO_BYTES,
            )
        else:
            from app.core.exceptions import BadRequestException
            raise BadRequestException("No valid file found in multipart upload.")
    else:
        try:
            body = await request.json()
            b64_data = body.get("base64_data") or body.get("image_base64")
            if not b64_data:
                from app.core.exceptions import BadRequestException
                raise BadRequestException("No image file or base64_data provided.")
            
            if "," in b64_data:
                b64_data = b64_data.split(",", 1)[1]
            
            img_bytes = base64.b64decode(b64_data)
            photo_id = uuid.uuid4().hex
            ext = "jpg"
            key = f"farmers/land_photos/{photo_id}.{ext}"
            dest = Path(settings.LOCAL_UPLOAD_DIR) / key
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(img_bytes)
            url = f"/uploads/{key}"
        except Exception as e:
            from app.core.exceptions import BadRequestException
            raise BadRequestException(f"Failed to process image upload: {str(e)}")

    if not url.startswith("http") and not url.startswith("/"):
        url = f"/{url}"

    return SuccessResponse(
        message="Land photo uploaded successfully.",
        data=RegistrationPhotoUploadResponse(url=url, message="Photo uploaded successfully."),
    )

@router.post(
    "/step-1",
    response_model=SuccessResponse[RegistrationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Farmer Identity Verification (Step 1)",
)
async def step_1(
    payload: Step1Request,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[RegistrationResponse]:
    created_by = f"farmer:{current_farmer.id}"
    data = await svc.process_step_1(payload, farmer_id=str(current_farmer.id), created_by=created_by)
    return SuccessResponse(message="Step 1 details saved successfully.", data=data)

@router.put(
    "/{registration_id}/step-2",
    response_model=SuccessResponse[RegistrationResponse],
    summary="Farm Metrics (Step 2)",
)
async def step_2(
    registration_id: str,
    payload: Step2Request,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[RegistrationResponse]:
    data = await svc.process_step_2(registration_id, payload)
    return SuccessResponse(message="Step 2 details saved successfully.", data=data)

@router.put(
    "/{registration_id}/step-3",
    response_model=SuccessResponse[RegistrationResponse],
    summary="Land Address (Step 3)",
)
async def step_3(
    registration_id: str,
    payload: Step3Request,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[RegistrationResponse]:
    data = await svc.process_step_3(registration_id, payload)
    return SuccessResponse(message="Step 3 details saved successfully.", data=data)

@router.put(
    "/{registration_id}/step-4",
    response_model=Step4Response,
    summary="Satellite Boundary Mapping (Step 4)",
)
async def step_4(
    registration_id: str,
    payload: Step4Request,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> Step4Response:
    return await svc.process_step_4(registration_id, payload)

@router.get(
    "/{registration_id}/step-4",
    summary="Retrieve previously saved boundary (Step 4)",
)
async def get_step_4(
    registration_id: str,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> dict:
    return await svc.get_step_4_boundary(registration_id)

@router.delete(
    "/{registration_id}/step-4",
    summary="Clear saved boundary (Step 4)",
)
async def delete_step_4(
    registration_id: str,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> dict:
    return await svc.clear_step_4_boundary(registration_id)

@router.put(
    "/{registration_id}/photos",
    response_model=SuccessResponse[RegistrationResponse],
    summary="Upload & save land ground photos",
)
async def save_photos(
    registration_id: str,
    payload: StepPhotosRequest,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[RegistrationResponse]:
    data = await svc.process_step_photos(registration_id, payload)
    return SuccessResponse(message="Land photos saved successfully.", data=data)

@router.put(
    "/{registration_id}/step-5",
    response_model=SuccessResponse[RegistrationResponse],
    summary="Schedule Baseline Audit (Step 5)",
)
async def step_5(
    registration_id: str,
    payload: Step5Request,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[RegistrationResponse]:
    data = await svc.process_step_5(registration_id, payload)
    return SuccessResponse(message="Step 5 details saved successfully.", data=data)

@router.put(
    "/{registration_id}/step-6",
    response_model=SuccessResponse[RegistrationResponse],
    summary="Climate Tree Insurance (Step 6)",
)
async def step_6(
    registration_id: str,
    payload: Step6Request,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[RegistrationResponse]:
    data = await svc.process_step_6(registration_id, payload)
    return SuccessResponse(message="Step 6 details saved successfully.", data=data)

@router.get(
    "/{registration_id}/invoice",
    response_model=SuccessResponse[InvoiceResponse],
    summary="Generate Dynamic Invoice (Step 7)",
)
async def get_invoice(
    registration_id: str,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[InvoiceResponse]:
    data = await svc.get_or_generate_invoice(registration_id)
    return SuccessResponse(message="Invoice generated successfully.", data=data)

@router.post(
    "/{registration_id}/submit",
    response_model=SuccessResponse[SubmitRegistrationResponse],
    summary="Submit Registration (Step 8)",
)
async def submit_registration(
    registration_id: str,
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[SubmitRegistrationResponse]:
    data = await svc.submit_registration(registration_id)
    return SuccessResponse(message="Registration submitted successfully.", data=data)

@router.get(
    "/resume",
    response_model=SuccessResponse[RegistrationResponse],
    summary="Resume latest draft registration from last completed step",
)
async def resume(
    current_farmer: CurrentFarmer,
    svc: BhumiCredRegistrationService = Depends(get_registration_service),
) -> SuccessResponse[RegistrationResponse]:
    data = await svc.resume_registration(current_farmer.mobile)
    return SuccessResponse(message="Latest draft registration resumed successfully.", data=data)
