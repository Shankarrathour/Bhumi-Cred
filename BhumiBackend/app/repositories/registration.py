from typing import Optional, List, Tuple
from datetime import datetime, timezone
from app.models.registration import BhumiCredRegistration
from app.models.invoice import Invoice
from app.models.audit_schedule import AuditSchedule
from app.repositories.base import BaseRepository

class BhumiCredRegistrationRepository(BaseRepository[BhumiCredRegistration]):
    def __init__(self):
        super().__init__(BhumiCredRegistration)

    async def get_latest_draft_by_mobile(self, mobile_number: str) -> Optional[BhumiCredRegistration]:
        return await BhumiCredRegistration.find_one(
            BhumiCredRegistration.mobile_number == mobile_number,
            BhumiCredRegistration.status == "draft"
        )

    async def get_by_registration_number(self, registration_number: str) -> Optional[BhumiCredRegistration]:
        return await BhumiCredRegistration.find_one(
            BhumiCredRegistration.registration_number == registration_number
        )

    async def get_by_application_id(self, application_id: str) -> Optional[BhumiCredRegistration]:
        return await BhumiCredRegistration.find_one(
            BhumiCredRegistration.application_id == application_id
        )

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        mobile_number: Optional[str] = None,
        farmer_id: Optional[str] = None,
    ) -> Tuple[List[BhumiCredRegistration], int]:
        query: dict = {}
        if status:
            query["status"] = status
        if mobile_number:
            query["mobile_number"] = mobile_number
        if farmer_id:
            query["farmer_id"] = farmer_id

        results = await BhumiCredRegistration.find(query).sort("-updated_at").skip(skip).limit(limit).to_list()
        total = await BhumiCredRegistration.find(query).count()
        return results, total

class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self):
        super().__init__(Invoice)

    async def get_by_registration_id(self, registration_id: str) -> Optional[Invoice]:
        return await Invoice.find_one(Invoice.registration_id == registration_id)

    async def get_by_invoice_number(self, invoice_number: str) -> Optional[Invoice]:
        return await Invoice.find_one(Invoice.invoice_number == invoice_number)

class AuditScheduleRepository(BaseRepository[AuditSchedule]):
    def __init__(self):
        super().__init__(AuditSchedule)

    async def get_by_registration_id(self, registration_id: str) -> Optional[AuditSchedule]:
        return await AuditSchedule.find_one(AuditSchedule.registration_id == registration_id)
