from typing import TypeVar, Generic, Optional, Any
from beanie import Document
from bson import ObjectId

DocType = TypeVar("DocType", bound=Document)


class BaseRepository(Generic[DocType]):
    """
    Generic async repository built on Beanie.
    All database access in the application must go through a repository.
    """

    def __init__(self, model: type[DocType]):
        self._model = model

    async def get_by_id(self, doc_id: str) -> Optional[DocType]:
        try:
            return await self._model.get(ObjectId(doc_id))
        except Exception:
            return None

    async def get_all(self, skip: int = 0, limit: int = 50) -> list[DocType]:
        return await self._model.find().skip(skip).limit(limit).to_list()

    async def create(self, document: DocType) -> DocType:
        return await document.insert()

    async def save(self, document: DocType) -> DocType:
        await document.save()
        return document

    async def delete(self, document: DocType) -> None:
        await document.delete()

    async def count(self, filter_query: dict[str, Any] | None = None) -> int:
        if filter_query:
            return await self._model.find(filter_query).count()
        return await self._model.count()
