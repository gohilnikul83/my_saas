# main.py
from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, BackgroundTasks, Request, Form
from pydantic import BaseModel, validator, EmailStr
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from email.mime.text import MIMEText
import asyncpg
import smtplib
import os
from datetime import datetime, time, date, timedelta
from dotenv import load_dotenv
from asyncpg.pool import Pool
from asyncpg import Pool
from fastapi.staticfiles import StaticFiles
import re


# Load environment variables from .env file
load_dotenv()

# Create the main FastAPI app
app = FastAPI(
    title="Manufacturing ERP API", 
    version="1.0.0",
    description="A comprehensive API for manufacturing ERP system"
)


# Create an APIRouter with the /api prefix
api_router = APIRouter(prefix="/api")

# Global variable to hold the database connection pool
pool = None

# Mount static folder
app.mount("/static", StaticFiles(directory="static"), name="static")




# Pydantic models for request/response
class ShiftBase(BaseModel):
    shift_name: str
    shift_start: time
    shift_end: time

class ShiftCreate(ShiftBase):
    pass

class ShiftResponse(ShiftBase):
    shift_id: int
    
    class Config:
        from_attributes = True

class DivisionBase(BaseModel):
    divn_name: str

class DivisionCreate(DivisionBase):
    pass

class DivisionResponse(DivisionBase):
    divn_id: int
    
    class Config:
        from_attributes = True

class BankBase(BaseModel):
    country_code: str
    bank_code: str
    bank_name: str

class BankCreate(BankBase):
    pass

class BankResponse(BankBase):
    bank_id: int
    
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    dept_name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    dept_id: int
    
    class Config:
        from_attributes = True

class DesignationBase(BaseModel):
    des_name: str

class DesignationCreate(DesignationBase):
    pass

class DesignationResponse(DesignationBase):
    des_id: int
    
    class Config:
        from_attributes = True

class BusRouteBase(BaseModel):
    route_name: str
    route_number: str

class BusRouteCreate(BusRouteBase):
    pass

class BusRouteResponse(BusRouteBase):
    route_id: int
    
    class Config:
        from_attributes = True

class BusRouteStopBase(BaseModel):
    route_id: int
    stop_name: str
    display_order: int

class BusRouteStopCreate(BusRouteStopBase):
    pass

class BusRouteStopResponse(BusRouteStopBase):
    stop_id: int
    
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    emp_code: str
    emp_name: str
    emp_address: Optional[str] = None
    emp_personal_contact: Optional[str] = None
    emp_personal_email: Optional[str] = None
    emp_emergency_contact: Optional[str] = None
    emp_dob: Optional[date] = None
    emp_last_education: Optional[str] = None
    emp_aadhar_name: Optional[str] = None
    emp_aadhar_no: Optional[str] = None
    emp_pan_no: Optional[str] = None
    emp_pan_name: Optional[str] = None
    emp_doj: date
    divn_id: Optional[int] = None
    dept_id: Optional[int] = None
    des_id: Optional[int] = None
    shift_id: Optional[int] = None
    emp_official_email: Optional[str] = None
    imm_superior_name: Optional[str] = None
    imm_superior_email: Optional[str] = None
    hod_name: Optional[str] = None
    hod_email: Optional[str] = None
    ctc: Optional[float] = None
    gross_salary: Optional[float] = None
    take_home_salary: Optional[float] = None
    emp_bank_acc_no: Optional[str] = None
    bank_id: Optional[int] = None
    bus_avail: bool = False
    route_id: Optional[int] = None
    stop_id: Optional[int] = None
    pl_bal: float = 0
    cl_bal: float = 0
    status: str = "Active"
    resignation_date: Optional[date] = None
    last_working_date: Optional[date] = None
    releaving_date: Optional[date] = None
    remarks: Optional[str] = None

    @validator('emp_personal_email', 'emp_official_email', 'imm_superior_email', 'hod_email')
    def email_validator(cls, v):
        if v is None:
            return v
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, v):
            raise ValueError('Invalid email format')
        return v

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int
    dept_name: Optional[str] = None
    des_name: Optional[str] = None
    shift_name: Optional[str] = None
    bank_name: Optional[str] = None
    route_name: Optional[str] = None
    stop_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Gate Pass Models
class GatePassBase(BaseModel):
    emp_id: int
    gate_pass_type: str
    gate_pass_time: datetime
    reason: Optional[str] = None
    status: Optional[str] = "Pending"
    approved_by: Optional[int] = None

class GatePassCreate(GatePassBase):
    pass

class GatePassResponse(GatePassBase):
    gate_pass_id: int
    emp_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Overtime Models
class OvertimeBase(BaseModel):
    emp_id: int
    overtime_date: date
    start_time: time
    end_time: time
    total_hours: float
    reason: Optional[str] = None
    status: Optional[str] = "Pending"
    approved_by: Optional[int] = None

class OvertimeCreate(OvertimeBase):
    pass

class OvertimeResponse(OvertimeBase):
    overtime_id: int
    emp_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_by_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Leave Models
class LeaveBase(BaseModel):
    emp_id: int
    leave_type: str
    start_date: date
    end_date: date
    total_days: float
    reason: Optional[str] = None
    status: Optional[str] = "Pending"
    approved_by: Optional[int] = None

class LeaveCreate(LeaveBase):
    pass

class LeaveResponse(LeaveBase):
    leave_id: int
    emp_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_by_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Missed Punch Models
class MissedPunchBase(BaseModel):
    emp_id: int
    punch_date: date
    punch_type: str
    actual_time: time
    reason: Optional[str] = None
    status: Optional[str] = "Pending"

class MissedPunchCreate(MissedPunchBase):
    pass

class MissedPunchResponse(MissedPunchBase):
    missed_punch_id: int
    emp_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_by_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Interview to Joining Modal

class InterviewJoiningBase(BaseModel):
    candidate_name: str
    address: Optional[str]
    email: str
    contact_number: Optional[str]
    birthdate: Optional[date] = None
    hobbies: Optional[str]
    languages_known: Optional[str]           
    languages_known_other: Optional[str] = None      
    strength: Optional[str]
    weakness: Optional[str]
    father_name: Optional[str]
    mother_name: Optional[str]
    siblings: Optional[int]
    marital_status: Optional[str]
    spouse_name: Optional[str]
    last_degree: Optional[str]
    passing_year: Optional[int]
    work_status: Optional[str]
    current_employer: Optional[str]
    current_ctc: Optional[float]
    current_designation: Optional[str]
    current_joining_date: Optional[date] = None
    current_bond: Optional[bool]
    notice_period_days: Optional[int]
    second_employer: Optional[str]
    second_designation: Optional[str]
    second_joining_date: Optional[date] = None
    second_releaving_date: Optional[date] = None
    third_employer: Optional[str]
    third_designation: Optional[str]
    third_joining_date: Optional[date] = None
    third_releaving_date: Optional[date] = None
    remarks: Optional[str]
    post_apply: str
    sent_to_dept: str
    inter_name: str
    status: Optional[str] = "Pending"
    
    @validator('birthdate', 'current_joining_date', 'second_joining_date', 
               'second_releaving_date', 'third_joining_date', 'third_releaving_date', 
               pre=True)
    def parse_date_fields(cls, value):
        if value is None or value == '':
            return None
        if isinstance(value, date):
            return value
        try:
            return date.fromisoformat(value)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid date format: {value}")

    @validator('current_bond', pre=True)  # Replace with actual boolean field name
    def convert_to_boolean(cls, value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            if value.lower() in ('true', 'yes', '1', 'on'):
                return True
            if value.lower() in ('false', 'no', '0', 'off', ''):
                return False
        return bool(value)

class InterviewJoiningCreate(InterviewJoiningBase):
    pass


class InterviewJoiningResponse(InterviewJoiningBase):
    id: int
    post_apply: Optional[str] = None
    sent_to_dept: Optional[str] = None
    inter_name: Optional[str] = None
    join_date: Optional[date] = None
    des_given: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Base model for resignation submission
class ResignationBase(BaseModel):
    emp_code: str
    emp_name: str
    des_name: str = None
    dept_name: str = None
    #divn_name: str = None
    reason: str
    hod_name: str
    hod_email: str
    resignation_date: date
    status: Optional[str] = "Pending"
    releaving_date: Optional[date] = None
    remarks: Optional[str] = None

class ResignationCreate(ResignationBase):
    pass

class ResignationResponse(ResignationBase):
    resignation_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Base model for Business Partners

class BusinessPartnerBase(BaseModel):
    bptype_id: int
    bpgroup_id: int
    bpname: str
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    pan_no: Optional[str] = None
    tan_no: Optional[str] = None
    tin_no: Optional[str] = None
    msme_no: Optional[str] = None
    cp_name: Optional[str] = None
    cp_mobile: Optional[str] = None
    cp_email: Optional[str] = None
    paddressline1: Optional[str] = None
    paddressline2: Optional[str] = None
    paddressline3: Optional[str] = None
    paddressline4: Optional[str] = None
    paddressline5: Optional[str] = None
    pcity: Optional[str] = None
    pzipcode: Optional[str] = None
    pstate: Optional[str] = None
    pcountry: Optional[str] = None
    pgstrno: Optional[str] = None
    pgsttype_id: Optional[int] = None
    saddressline1: Optional[str] = None
    saddressline2: Optional[str] = None
    saddressline3: Optional[str] = None
    saddressline4: Optional[str] = None
    saddressline5: Optional[str] = None
    scity: Optional[str] = None
    szipcode: Optional[str] = None
    sstate: Optional[str] = None
    scountry: Optional[str] = None
    sgstrno: Optional[str] = None
    sgsttype_id: Optional[int] = None
    bank_id: Optional[int] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_city: Optional[str] = None
    bank_state: Optional[str] = None
    bank_country: Optional[str] = None
    remarks: Optional[str] = None
    cp_dob: Optional[date] = None
    cp_desi: Optional[str] = None

class BusinessPartnerCreate(BusinessPartnerBase):
    pass

class BusinessPartnerResponse(BusinessPartnerBase):
    bpcode: str
    bptype_name: Optional[str] = None
    bpgroup_name: Optional[str] = None
    bank_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Pydantic models for Item Master
class ItemMasterBase(BaseModel):
    it_name: str
    it_details: Optional[str] = None
    it_group: Optional[int] = None
    it_uom: Optional[int] = None
    it_type: Optional[int] = None
    it_mfg: Optional[str] = None
    it_hsn: Optional[str] = None
    it_whs: Optional[int] = None
    it_moq: Optional[float] = None
    it_min: Optional[float] = None
    it_max: Optional[float] = None
    it_lead: Optional[int] = None
    it_status: str = "Active"
    it_remark: Optional[str] = None
    it_attach: Optional[str] = None

class ItemMasterCreate(ItemMasterBase):
    pass

class ItemMasterCreate(ItemMasterBase):
    category_ids: List[int] = [] 

class ItemMasterResponse(ItemMasterBase):
    it_id: int
    it_code: str
    group_name: Optional[str] = None
    uom_name: Optional[str] = None
    category_names: List[str] = []
    type_name: Optional[str] = None
    whs_name: Optional[str] = None
    current_stock: Optional[float] = None
    category_ids: List[int] = []
    
    class Config:
        from_attributes = True

# Pydantic model for stock transactions
class StockTransactionBase(BaseModel):
    item_id: int
    trans_type: str
    reference_type: str
    reference_id: Optional[str] = None
    warehouse_id: Optional[int] = None
    stock_qty: float
    unit_cost: Optional[float] = 0
    remarks: Optional[str] = None
    created_by: Optional[str] = None

class StockTransactionCreate(StockTransactionBase):
    pass

class StockTransactionResponse(StockTransactionBase):
    trans_id: int
    trans_date: datetime
    balance_qty: float
    it_code: Optional[str] = None
    it_name: Optional[str] = None
    whs_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Pydantic models for Posting Periods
class PostingPeriodBase(BaseModel):
    period_code: str
    period_name: str
    start_date: date
    end_date: date
    fiscal_year: int
    period_month: Optional[int] = None
    period_status: str = "Open"
    allow_posting: bool = True
    allow_goods_receipt: bool = True
    allow_goods_issue: bool = True
    allow_invoice_verification: bool = True
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

class PostingPeriodCreate(PostingPeriodBase):
    pass

class PostingPeriodResponse(PostingPeriodBase):
    period_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PostingPeriodStatusUpdate(BaseModel):
    period_status: str

# Pydantic models for Purchase Request Header-Row Structure
class PurReqRowBase(BaseModel):
    line_no: int
    it_id: int
    it_code: str
    it_name: str
    it_details: Optional[str] = None
    it_hsn: Optional[str] = None
    need_date: date
    current_stock: float = 0
    req_qty: float
    created_by: Optional[str] = None

class PurReqRowCreate(PurReqRowBase):
    pass

class PurReqRowResponse(PurReqRowBase):
    req_row_id: int
    req_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PurReqHeaderBase(BaseModel):
    emp_code: str
    emp_name: str
    emp_dept: int
    post_dt: date
    doc_dt: date
    priority: str = "Medium"
    req_status: str = "Pending"
    remarks: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

class PurReqHeaderCreate(PurReqHeaderBase):
    rows: List[PurReqRowCreate] = []

class PurReqHeaderResponse(PurReqHeaderBase):
    req_id: int
    req_no: str
    valid_dt: date
    total_qty: float = 0  # Sum of all row quantities for UI
    created_at: datetime
    updated_at: datetime
    rows: List[PurReqRowResponse] = []
    
    class Config:
        from_attributes = True

class PurReqStatusUpdate(BaseModel):
    req_status: str

# For individual row operations
class PurReqRowUpdate(BaseModel):
    line_no: int
    it_id: int
    it_code: str
    it_name: str
    it_details: Optional[str] = None
    it_hsn: Optional[str] = None
    need_date: date
    current_stock: float = 0
    req_qty: float


# Pydantic models for Purchase Order
class PurOrdRowBase(BaseModel):
    line_no: int
    it_id: int
    it_code: str
    it_name: str
    it_details: Optional[str] = None
    hsn_code: Optional[str] = None
    uom_id: Optional[int] = None
    req_qty: float
    need_date: date
    unit_price: float = 0
    discount_percent: float = 0
    discount_amt: float = 0
    tax_code: Optional[str] = None
    tax_rate: float = 0
    tax_amt: float = 0
    line_total: float = 0
    whs_id: Optional[int] = None
    pr_req_id: Optional[int] = None
    pr_line_no: Optional[int] = None
    pr_no: Optional[str] = None
    created_by: Optional[str] = None

class PurOrdRowCreate(PurOrdRowBase):
    pass

class PurOrdRowResponse(PurOrdRowBase):
    po_row_id: int
    po_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PurOrdHeaderBase(BaseModel):
    post_per: int
    post_dt: date
    doc_dt: date
    bpcode: str
    bpname: str
    emp_code: str
    emp_name: str
    dept_id: int
    subtotal: float = 0
    discount_amt: float = 0
    tax_amt: float = 0
    total_amt: float = 0
    po_status: str = "Open"
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

class PurOrdHeaderCreate(PurOrdHeaderBase):
    rows: List[PurOrdRowCreate] = []

class PurOrdHeaderResponse(PurOrdHeaderBase):
    po_id: int
    po_no: str
    created_at: datetime
    updated_at: datetime
    rows: List[PurOrdRowResponse] = []
    
    class Config:
        from_attributes = True

class PurOrdStatusUpdate(BaseModel):
    po_status: str

# Model for converting PR to PO
class PRToPOConversion(BaseModel):
    req_ids: List[int]  # List of PR IDs to convert
    bpcode: str  # Selected vendor
    bpname: str  # Vendor name
    post_dt: date
    doc_dt: date
    created_by: Optional[str] = None

# Database connection
async def get_db_connection():
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(os.getenv('DATABASE_URL'))
    return pool

# Database Pool for Tasks API
async def get_db_pool() -> asyncpg.pool.Pool:
    return await get_db_connection()

# Event handler for when the application starts up
@api_router.on_event("startup")
async def startup_event():
    global pool
    try:
        pool = await asyncpg.create_pool(os.getenv('DATABASE_URL'))
        print("Successfully connected to the database.")
    except Exception as e:
        print(f"Error connecting to database: {e}")

# Event handler for when the application shuts down
@api_router.on_event("shutdown")
async def shutdown_event():
    global pool
    if pool:
        await pool.close()
        print("Database connection closed.")

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Manufacturing ERP API is running successfully!"}


# BP Types Endpoint
@api_router.get("/bp-types")
async def get_bp_types():
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT * FROM bp_type_ref ORDER BY bptype_name;")
        return [dict(r) for r in records]

# BP Groups Endpoints
@api_router.get("/bp-groups")
async def get_bp_groups():
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT * FROM bp_group_ref ORDER BY bpgroup_name;")
        return [dict(r) for r in records]

# SHIFT ENDPOINTS
@api_router.get("/shifts", response_model=List[ShiftResponse])
async def get_shifts():
    try:
        async with pool.acquire() as connection:
            shifts = await connection.fetch("SELECT * FROM shift_master ORDER BY shift_id;")
            return [dict(shift) for shift in shifts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching shifts: {str(e)}")

@api_router.post("/shifts", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def create_shift(shift: ShiftCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                INSERT INTO shift_master (shift_name, shift_start, shift_end)
                VALUES ($1, $2, $3) RETURNING *;
            """
            result = await connection.fetchrow(query, shift.shift_name, shift.shift_start, shift.shift_end)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating shift: {str(e)}")

@api_router.put("/shifts/{shift_id}", response_model=ShiftResponse)
async def update_shift(shift_id: int, shift: ShiftCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                UPDATE shift_master 
                SET shift_name = $1, shift_start = $2, shift_end = $3
                WHERE shift_id = $4 RETURNING *;
            """
            result = await connection.fetchrow(query, shift.shift_name, shift.shift_start, shift.shift_end, shift_id)
            if not result:
                raise HTTPException(status_code=404, detail="Shift not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating shift: {str(e)}")

@api_router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM shift_master WHERE shift_id = $1;", shift_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Shift not found")
            return {"message": "Shift deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting shift: {str(e)}")

# DIVISION ENDPOINTS
@api_router.get("/divisions", response_model=List[DivisionResponse])
async def get_divisions():
    try:
        async with pool.acquire() as connection:
            divisions = await connection.fetch("SELECT * FROM division_master ORDER BY divn_id;")
            return [dict(division) for division in divisions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching divisions: {str(e)}")

@api_router.post("/divisions", response_model=DivisionResponse, status_code=status.HTTP_201_CREATED)
async def create_division(division: DivisionCreate):
    try:
        async with pool.acquire() as connection:
            query = "INSERT INTO division_master (divn_name) VALUES ($1) RETURNING *;"
            result = await connection.fetchrow(query, division.divn_name)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating division: {str(e)}")

@api_router.put("/divisions/{divn_id}", response_model=DivisionResponse)
async def update_division(divn_id: int, division: DivisionCreate):
    try:
        async with pool.acquire() as connection:
            query = "UPDATE division_master SET divn_name = $1 WHERE divn_id = $2 RETURNING *;"
            result = await connection.fetchrow(query, division.divn_name, divn_id)
            if not result:
                raise HTTPException(status_code=404, detail="Division not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating division: {str(e)}")

@api_router.delete("/divisions/{divn_id}")
async def delete_division(divn_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM division_master WHERE divn_id = $1;", divn_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Division not found")
            return {"message": "Division deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting division: {str(e)}")

# BANK ENDPOINTS
@api_router.get("/banks", response_model=List[BankResponse])
async def get_banks():
    try:
        async with pool.acquire() as connection:
            banks = await connection.fetch("SELECT * FROM bank_master ORDER BY bank_id;")
            return [dict(bank) for bank in banks]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching banks: {str(e)}")

@api_router.post("/banks", response_model=BankResponse, status_code=status.HTTP_201_CREATED)
async def create_bank(bank: BankCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                INSERT INTO bank_master (country_code, bank_code, bank_name)
                VALUES ($1, $2, $3) RETURNING *;
            """
            result = await connection.fetchrow(query, bank.country_code, bank.bank_code, bank.bank_name)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bank: {str(e)}")

@api_router.put("/banks/{bank_id}", response_model=BankResponse)
async def update_bank(bank_id: int, bank: BankCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                UPDATE bank_master 
                SET country_code = $1, bank_code = $2, bank_name = $3
                WHERE bank_id = $4 RETURNING *;
            """
            result = await connection.fetchrow(query, bank.country_code, bank.bank_code, bank.bank_name, bank_id)
            if not result:
                raise HTTPException(status_code=404, detail="Bank not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating bank: {str(e)}")

@api_router.delete("/banks/{bank_id}")
async def delete_bank(bank_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM bank_master WHERE bank_id = $1;", bank_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Bank not found")
            return {"message": "Bank deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting bank: {str(e)}")

# DEPARTMENT ENDPOINTS
@api_router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments():
    try:
        async with pool.acquire() as connection:
            departments = await connection.fetch("SELECT * FROM department_master ORDER BY dept_id;")
            return [dict(dept) for dept in departments]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching departments: {str(e)}")

@api_router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(department: DepartmentCreate):
    try:
        async with pool.acquire() as connection:
            query = "INSERT INTO department_master (dept_name) VALUES ($1) RETURNING *;"
            result = await connection.fetchrow(query, department.dept_name)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating department: {str(e)}")

@api_router.put("/departments/{dept_id}", response_model=DepartmentResponse)
async def update_department(dept_id: int, department: DepartmentCreate):
    try:
        async with pool.acquire() as connection:
            query = "UPDATE department_master SET dept_name = $1 WHERE dept_id = $2 RETURNING *;"
            result = await connection.fetchrow(query, department.dept_name, dept_id)
            if not result:
                raise HTTPException(status_code=404, detail="Department not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating department: {str(e)}")

@api_router.delete("/departments/{dept_id}")
async def delete_department(dept_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM department_master WHERE dept_id = $1;", dept_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Department not found")
            return {"message": "Department deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting department: {str(e)}")

# DESIGNATION ENDPOINTS
@api_router.get("/designations", response_model=List[DesignationResponse])
async def get_designations():
    try:
        async with pool.acquire() as connection:
            designations = await connection.fetch("SELECT * FROM designation_master ORDER BY des_id;")
            return [dict(des) for des in designations]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching designations: {str(e)}")

@api_router.post("/designations", response_model=DesignationResponse, status_code=status.HTTP_201_CREATED)
async def create_designation(designation: DesignationCreate):
    try:
        async with pool.acquire() as connection:
            query = "INSERT INTO designation_master (des_name) VALUES ($1) RETURNING *;"
            result = await connection.fetchrow(query, designation.des_name)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating designation: {str(e)}")

@api_router.put("/designations/{des_id}", response_model=DesignationResponse)
async def update_designation(des_id: int, designation: DesignationCreate):
    try:
        async with pool.acquire() as connection:
            query = "UPDATE designation_master SET des_name = $1 WHERE des_id = $2 RETURNING *;"
            result = await connection.fetchrow(query, designation.des_name, des_id)
            if not result:
                raise HTTPException(status_code=404, detail="Designation not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating designation: {str(e)}")

@api_router.delete("/designations/{des_id}")
async def delete_designation(des_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM designation_master WHERE des_id = $1;", des_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Designation not found")
            return {"message": "Designation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting designation: {str(e)}")

# EMPLOYEE ENDPOINTS
@api_router.get("/employees", response_model=List[EmployeeResponse])
async def get_employees():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    em.*,
                    dm.dept_name, dsm.des_name, sm.shift_name,
                    bm.bank_name, br.route_name, brs.stop_name
                FROM employee_master em
                LEFT JOIN department_master dm ON em.dept_id = dm.dept_id
                LEFT JOIN designation_master dsm ON em.des_id = dsm.des_id
                LEFT JOIN shift_master sm ON em.shift_id = sm.shift_id
                LEFT JOIN bank_master bm ON em.bank_id = bm.bank_id
                LEFT JOIN bus_route br ON em.route_id = br.route_id
                LEFT JOIN bus_route_stop brs ON em.stop_id = brs.stop_id
                ORDER BY em.id;
            """
            employees = await connection.fetch(query)
            return [dict(emp) for emp in employees]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching employees: {str(e)}")

@api_router.get("/employees/{emp_code}", response_model=EmployeeResponse)
async def get_employee(emp_code: str):
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    em.*,
                    dm.dept_name, dsm.des_name, sm.shift_name,
                    bm.bank_name, br.route_name, brs.stop_name
                FROM employee_master em
                LEFT JOIN department_master dm ON em.dept_id = dm.dept_id
                LEFT JOIN designation_master dsm ON em.des_id = dsm.des_id
                LEFT JOIN shift_master sm ON em.shift_id = sm.shift_id
                LEFT JOIN bank_master bm ON em.bank_id = bm.bank_id
                LEFT JOIN bus_route br ON em.route_id = br.route_id
                LEFT JOIN bus_route_stop brs ON em.stop_id = brs.stop_id
                WHERE em.emp_code = $1;
            """
            employee = await connection.fetchrow(query, emp_code)
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found")
            return dict(employee)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching employee: {str(e)}")

@api_router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(employee: EmployeeCreate):
    try:
        async with pool.acquire() as connection:
            # First, let's check if the employee code already exists
            existing_employee = await connection.fetchrow(
                "SELECT id FROM employee_master WHERE emp_code = $1;", 
                employee.emp_code
            )
            
            if existing_employee:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employee code already exists"
                )
            
            # Check if foreign keys exist
            if employee.dept_id:
                dept_exists = await connection.fetchrow(
                    "SELECT dept_id FROM department_master WHERE dept_id = $1;", 
                    employee.dept_id
                )
                if not dept_exists:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Department with ID {employee.dept_id} does not exist"
                    )
            
            # Similar checks for other foreign keys...
            
            query = """
                INSERT INTO employee_master (
                    emp_code, emp_name, emp_address, emp_personal_contact, emp_personal_email,
                    emp_emergency_contact, emp_dob, emp_last_education, emp_aadhar_name, emp_aadhar_no,
                    emp_pan_no, emp_pan_name, emp_doj, divn_id, dept_id, des_id, shift_id,
                    emp_official_email, imm_superior_name, imm_superior_email, hod_name, hod_email,
                    ctc, gross_salary, take_home_salary, emp_bank_acc_no, bank_id,
                    bus_avail, route_id, stop_id, pl_bal, cl_bal, status,
                    resignation_date, last_working_date, releaving_date, remarks
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                    $31, $32, $33, $34, $35, $36, $37
                ) RETURNING *;
            """
            
            # Convert None values to NULL for the database
            params = [
                employee.emp_code, employee.emp_name, employee.emp_address, employee.emp_personal_contact,
                employee.emp_personal_email, employee.emp_emergency_contact, employee.emp_dob,
                employee.emp_last_education, employee.emp_aadhar_name, employee.emp_aadhar_no,
                employee.emp_pan_no, employee.emp_pan_name, employee.emp_doj, employee.divn_id,
                employee.dept_id, employee.des_id, employee.shift_id, employee.emp_official_email,
                employee.imm_superior_name, employee.imm_superior_email, employee.hod_name,
                employee.hod_email, employee.ctc, employee.gross_salary, employee.take_home_salary,
                employee.emp_bank_acc_no, employee.bank_id, employee.bus_avail, employee.route_id,
                employee.stop_id, employee.pl_bal, employee.cl_bal, employee.status,
                employee.resignation_date, employee.last_working_date, employee.releaving_date,
                employee.remarks
            ]
            
            # Replace None with NULL for database
            params = [param if param is not None else None for param in params]
            
            result = await connection.fetchrow(query, *params)
            return dict(result)
            
    except HTTPException:
        raise
    except Exception as e:
        # Print the full error for debugging
        print(f"Full error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating employee: {str(e)}"
        )

@api_router.put("/employees/{emp_id}", response_model=EmployeeResponse)
async def update_employee(emp_id: int, employee: EmployeeCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                UPDATE employee_master SET
                    emp_code = $1, emp_name = $2, emp_address = $3, emp_personal_contact = $4,
                    emp_personal_email = $5, emp_emergency_contact = $6, emp_dob = $7,
                    emp_last_education = $8, emp_aadhar_name = $9, emp_aadhar_no = $10,
                    emp_pan_no = $11, emp_pan_name = $12, emp_doj = $13, divn_id = $14,
                    dept_id = $15, des_id = $16, shift_id = $17, emp_official_email = $18,
                    imm_superior_name = $19, imm_superior_email = $20, hod_name = $21,
                    hod_email = $22, ctc = $23, gross_salary = $24, take_home_salary = $25,
                    emp_bank_acc_no = $26, bank_id = $27, bus_avail = $28, route_id = $29,
                    stop_id = $30, pl_bal = $31, cl_bal = $32, status = $33,
                    resignation_date = $34, last_working_date = $35, releaving_date = $36,
                    remarks = $37
                WHERE id = $38 RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                employee.emp_code, employee.emp_name, employee.emp_address, employee.emp_personal_contact,
                employee.emp_personal_email, employee.emp_emergency_contact, employee.emp_dob,
                employee.emp_last_education, employee.emp_aadhar_name, employee.emp_aadhar_no,
                employee.emp_pan_no, employee.emp_pan_name, employee.emp_doj, employee.divn_id,
                employee.dept_id, employee.des_id, employee.shift_id, employee.emp_official_email,
                employee.imm_superior_name, employee.imm_superior_email, employee.hod_name,
                employee.hod_email, employee.ctc, employee.gross_salary, employee.take_home_salary,
                employee.emp_bank_acc_no, employee.bank_id, employee.bus_avail, employee.route_id,
                employee.stop_id, employee.pl_bal, employee.cl_bal, employee.status,
                employee.resignation_date, employee.last_working_date, employee.releaving_date,
                employee.remarks, emp_id
            )
            if not result:
                raise HTTPException(status_code=404, detail="Employee not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating employee: {str(e)}")

@api_router.delete("/employees/{emp_id}")
async def delete_employee(emp_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM employee_master WHERE id = $1;", emp_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Employee not found")
            return {"message": "Employee deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting employee: {str(e)}")

# DIVISION ENDPOINTS
@api_router.get("/divisions", response_model=List[DivisionResponse])
async def get_divisions():
    try:
        async with pool.acquire() as connection:
            divisions = await connection.fetch("SELECT * FROM division_master ORDER BY divn_id;")
            return [dict(division) for division in divisions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching divisions: {str(e)}")

@api_router.post("/divisions", response_model=DivisionResponse, status_code=status.HTTP_201_CREATED)
async def create_division(division: DivisionCreate):
    try:
        async with pool.acquire() as connection:
            query = "INSERT INTO division_master (divn_name) VALUES ($1) RETURNING *;"
            result = await connection.fetchrow(query, division.divn_name)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating division: {str(e)}")

@api_router.put("/divisions/{divn_id}", response_model=DivisionResponse)
async def update_division(divn_id: int, division: DivisionCreate):
    try:
        async with pool.acquire() as connection:
            query = "UPDATE division_master SET divn_name = $1 WHERE divn_id = $2 RETURNING *;"
            result = await connection.fetchrow(query, division.divn_name, divn_id)
            if not result:
                raise HTTPException(status_code=404, detail="Division not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating division: {str(e)}")

@api_router.delete("/divisions/{divn_id}")
async def delete_division(divn_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM division_master WHERE divn_id = $1;", divn_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Division not found")
            return {"message": "Division deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting division: {str(e)}")

# BANK ENDPOINTS
@api_router.get("/banks", response_model=List[BankResponse])
async def get_banks():
    try:
        async with pool.acquire() as connection:
            banks = await connection.fetch("SELECT * FROM bank_master ORDER BY bank_id;")
            return [dict(bank) for bank in banks]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching banks: {str(e)}")

@api_router.post("/banks", response_model=BankResponse, status_code=status.HTTP_201_CREATED)
async def create_bank(bank: BankCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                INSERT INTO bank_master (country_code, bank_code, bank_name)
                VALUES ($1, $2, $3) RETURNING *;
            """
            result = await connection.fetchrow(query, bank.country_code, bank.bank_code, bank.bank_name)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bank: {str(e)}")

@api_router.put("/banks/{bank_id}", response_model=BankResponse)
async def update_bank(bank_id: int, bank: BankCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                UPDATE bank_master 
                SET country_code = $1, bank_code = $2, bank_name = $3
                WHERE bank_id = $4 RETURNING *;
            """
            result = await connection.fetchrow(query, bank.country_code, bank.bank_code, bank.bank_name, bank_id)
            if not result:
                raise HTTPException(status_code=404, detail="Bank not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating bank: {str(e)}")

@api_router.delete("/banks/{bank_id}")
async def delete_bank(bank_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM bank_master WHERE bank_id = $1;", bank_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Bank not found")
            return {"message": "Bank deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting bank: {str(e)}")

# BUS ROUTE ENDPOINTS
@api_router.get("/bus-routes", response_model=List[BusRouteResponse])
async def get_bus_routes():
    try:
        async with pool.acquire() as connection:
            routes = await connection.fetch("SELECT * FROM bus_route ORDER BY route_id;")
            return [dict(route) for route in routes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching bus routes: {str(e)}")

@api_router.post("/bus-routes", response_model=BusRouteResponse, status_code=status.HTTP_201_CREATED)
async def create_bus_route(route: BusRouteCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                INSERT INTO bus_route (route_name, route_number)
                VALUES ($1, $2) RETURNING *;
            """
            result = await connection.fetchrow(query, route.route_name, route.route_number)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bus route: {str(e)}")

@api_router.put("/bus-routes/{route_id}", response_model=BusRouteResponse)
async def update_bus_route(route_id: int, route: BusRouteCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                UPDATE bus_route 
                SET route_name = $1, route_number = $2
                WHERE route_id = $3 RETURNING *;
            """
            result = await connection.fetchrow(query, route.route_name, route.route_number, route_id)
            if not result:
                raise HTTPException(status_code=404, detail="Bus route not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating bus route: {str(e)}")

@api_router.delete("/bus-routes/{route_id}")
async def delete_bus_route(route_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM bus_route WHERE route_id = $1;", route_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Bus route not found")
            return {"message": "Bus route deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting bus route: {str(e)}")

# BUS ROUTE STOP ENDPOINTS
@api_router.get("/bus-route-stops", response_model=List[BusRouteStopResponse])
async def get_bus_route_stops():
    try:
        async with pool.acquire() as connection:
            stops = await connection.fetch("""
                SELECT brs.*, br.route_name 
                FROM bus_route_stop brs
                JOIN bus_route br ON brs.route_id = br.route_id
                ORDER BY brs.route_id, brs.display_order;
            """)
            return [dict(stop) for stop in stops]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching bus route stops: {str(e)}")

@api_router.get("/bus-routes/{route_id}/stops", response_model=List[BusRouteStopResponse])
async def get_bus_route_stops_by_route(route_id: int):
    try:
        async with pool.acquire() as connection:
            stops = await connection.fetch("""
                SELECT brs.*, br.route_name 
                FROM bus_route_stop brs
                JOIN bus_route br ON brs.route_id = br.route_id
                WHERE brs.route_id = $1
                ORDER BY brs.display_order;
            """, route_id)
            return [dict(stop) for stop in stops]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching bus route stops: {str(e)}")

@api_router.post("/bus-route-stops", response_model=BusRouteStopResponse, status_code=status.HTTP_201_CREATED)
async def create_bus_route_stop(stop: BusRouteStopCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                INSERT INTO bus_route_stop (route_id, stop_name, display_order)
                VALUES ($1, $2, $3) RETURNING *;
            """
            result = await connection.fetchrow(query, stop.route_id, stop.stop_name, stop.display_order)
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bus route stop: {str(e)}")

@api_router.put("/bus-route-stops/{stop_id}", response_model=BusRouteStopResponse)
async def update_bus_route_stop(stop_id: int, stop: BusRouteStopCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                UPDATE bus_route_stop AS brs
                SET route_id = $1, stop_name = $2, display_order = $3
                FROM bus_route br
                WHERE brs.stop_id = $4 AND br.route_id = $1
                RETURNING brs.*, br.route_name;
                
            """
            result = await connection.fetchrow(query, stop.route_id, stop.stop_name, stop.display_order, stop_id)
            if not result:
                raise HTTPException(status_code=404, detail="Bus route stop not found")
            return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating bus route stop: {str(e)}")

@api_router.delete("/bus-route-stops/{stop_id}")
async def delete_bus_route_stop(stop_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM bus_route_stop WHERE stop_id = $1;", stop_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Bus route stop not found")
            return {"message": "Bus route stop deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting bus route stop: {str(e)}")

# GATE PASS ENDPOINTS
@api_router.get("/gate-passes", response_model=List[GatePassResponse])
async def get_gate_passes():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    gp.gate_pass_id,
                    gp.emp_id,
                    em.emp_name AS emp_name,
                    gp.gate_pass_type,
                    gp.gate_pass_time,
                    gp.reason,
                    gp.status,
                    gp.approved_by_name,
                    gp.approved_by_email,
                    gp.created_at,
                    gp.updated_at
                FROM employee_gate_pass gp
                LEFT JOIN employee_master em ON gp.emp_id = em.id
                ORDER BY gp.gate_pass_id;
            """
            records = await connection.fetch(query)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching gate passes: {str(e)}")

@api_router.post("/gate-passes", response_model=GatePassResponse, status_code=status.HTTP_201_CREATED)
async def create_gate_pass(gp: GatePassCreate):
    try:
        async with pool.acquire() as connection:
            # fetch requesting employee's HOD details
            emp = await connection.fetchrow("""
                SELECT hod_name, hod_email
                FROM employee_master
                WHERE id = $1
            """, gp.emp_id)

            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")

            # insert gate pass with HOD details
            query = """
                INSERT INTO employee_gate_pass (
                    emp_id, gate_pass_type, gate_pass_time, reason, status,
                    approved_by_name, approved_by_email, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, NOW(), NOW()
                ) RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                gp.emp_id, gp.gate_pass_type, gp.gate_pass_time,
                gp.reason, gp.status,
                emp["hod_name"], emp["hod_email"]
            )
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating gate pass: {str(e)}")

@api_router.put("/gate-passes/{gate_pass_id}", response_model=GatePassResponse)
async def update_gate_pass(gate_pass_id: int, gp: GatePassCreate):
    try:
        async with pool.acquire() as connection:
            emp = await connection.fetchrow("""
                SELECT hod_name, hod_email
                FROM employee_master
                WHERE id = $1
            """, gp.emp_id)

            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")

            query = """
                UPDATE employee_gate_pass
                SET emp_id = $1, gate_pass_type = $2, gate_pass_time = $3,
                    reason = $4, status = $5,
                    approved_by_name = $6, approved_by_email = $7,
                    updated_at = NOW()
                WHERE gate_pass_id = $8
                RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                gp.emp_id, gp.gate_pass_type, gp.gate_pass_time,
                gp.reason, gp.status,
                emp["hod_name"], emp["hod_email"], gate_pass_id
            )
            if not result:
                raise HTTPException(status_code=404, detail="Gate pass not found")
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating gate pass: {str(e)}")

@api_router.delete("/gate-passes/{gate_pass_id}")
async def delete_gate_pass(gate_pass_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM employee_gate_pass WHERE gate_pass_id = $1;", gate_pass_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Gate pass not found")
            return {"message": "Gate pass deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting gate pass: {str(e)}")

# OVERTIME ENDPOINTS
@api_router.get("/overtimes", response_model=List[OvertimeResponse])
async def get_overtimes():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    ot.*,
                    em.emp_name
                FROM employee_overtime ot
                LEFT JOIN employee_master em ON ot.emp_id = em.id
                ORDER BY ot.overtime_id;
            """
            records = await connection.fetch(query)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overtimes: {str(e)}")

@api_router.post("/overtimes", response_model=OvertimeResponse, status_code=status.HTTP_201_CREATED)
async def create_overtime(ot: OvertimeCreate):
    try:
        async with pool.acquire() as connection:
            # fetch employee HOD details
            emp = await connection.fetchrow("""
                SELECT hod_name, hod_email
                FROM employee_master
                WHERE id = $1
            """, ot.emp_id)

            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")

            query = """
                INSERT INTO employee_overtime (
                    emp_id, overtime_date, start_time, end_time, total_hours,
                    reason, status,
                    approved_by_name, approved_by_email,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7,
                    $8, $9,
                    NOW(), NOW()
                ) RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                ot.emp_id, ot.overtime_date, ot.start_time, ot.end_time, ot.total_hours,
                ot.reason, ot.status,
                emp["hod_name"], emp["hod_email"]
            )
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating overtime: {str(e)}")

@api_router.put("/overtimes/{overtime_id}", response_model=OvertimeResponse)
async def update_overtime(overtime_id: int, ot: OvertimeCreate):
    try:
        async with pool.acquire() as connection:
            emp = await connection.fetchrow("""
                SELECT hod_name, hod_email
                FROM employee_master
                WHERE id = $1
            """, ot.emp_id)

            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")

            query = """
                UPDATE employee_overtime
                SET emp_id = $1, overtime_date = $2, start_time = $3,
                    end_time = $4, total_hours = $5,
                    reason = $6, status = $7,
                    approved_by_name = $8, approved_by_email = $9,
                    updated_at = NOW()
                WHERE overtime_id = $10
                RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                ot.emp_id, ot.overtime_date, ot.start_time, ot.end_time, ot.total_hours,
                ot.reason, ot.status,
                emp["hod_name"], emp["hod_email"],
                overtime_id
            )
            if not result:
                raise HTTPException(status_code=404, detail="Overtime not found")
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating overtime: {str(e)}")

@api_router.delete("/overtimes/{overtime_id}")
async def delete_overtime(overtime_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM employee_overtime WHERE overtime_id = $1;", overtime_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Overtime not found")
            return {"message": "Overtime deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting overtime: {str(e)}")

# LEAVE ENDPOINTS
@api_router.get("/leaves", response_model=List[LeaveResponse])
async def get_leaves():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    lv.*,
                    em.emp_name
                FROM employee_leave lv
                LEFT JOIN employee_master em ON lv.emp_id = em.id
                ORDER BY lv.leave_id;
            """
            records = await connection.fetch(query)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leaves: {str(e)}")

#Leave Create
@api_router.post("/leaves", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
async def create_leave(lv: LeaveCreate):
    try:
        async with pool.acquire() as connection:
            # fetch employee HOD details
            emp = await connection.fetchrow("""
                SELECT hod_name, hod_email
                FROM employee_master
                WHERE id = $1
            """, lv.emp_id)

            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")

            query = """
                INSERT INTO employee_leave (
                    emp_id, leave_type, start_date, end_date, total_days,
                    reason, status,
                    approved_by_name, approved_by_email,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7,
                    $8, $9,
                    NOW(), NOW()
                ) RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                lv.emp_id, lv.leave_type, lv.start_date, lv.end_date, lv.total_days,
                lv.reason, lv.status,
                emp["hod_name"], emp["hod_email"]
            )
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating leave: {str(e)}")

@api_router.put("/leaves/{leave_id}", response_model=LeaveResponse)
async def update_leave(leave_id: int, lv: LeaveCreate):
    try:
        async with pool.acquire() as connection:
            emp = await connection.fetchrow("""
                SELECT hod_name, hod_email
                FROM employee_master
                WHERE id = $1
            """, lv.emp_id)

            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")

            query = """
                UPDATE employee_leave
                SET emp_id = $1, leave_type = $2, start_date = $3, end_date = $4,
                    total_days = $5, reason = $6, status = $7,
                    approved_by_name = $8, approved_by_email = $9,
                    updated_at = NOW()
                WHERE leave_id = $10
                RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                lv.emp_id, lv.leave_type, lv.start_date, lv.end_date, lv.total_days,
                lv.reason, lv.status,
                emp["hod_name"], emp["hod_email"],
                leave_id
            )
            if not result:
                raise HTTPException(status_code=404, detail="Leave not found")
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating leave: {str(e)}")

@api_router.delete("/leaves/{leave_id}")
async def delete_leave(leave_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM employee_leave WHERE leave_id = $1;", leave_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Leave not found")
            return {"message": "Leave deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting leave: {str(e)}")

# MISSED PUNCH ENDPOINTS
@api_router.get("/missed-punches", response_model=List[MissedPunchResponse])
async def get_missed_punches():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    mp.*,
                    em.emp_name
                FROM employee_missed_punch mp
                LEFT JOIN employee_master em ON mp.emp_id = em.id
                ORDER BY mp.missed_punch_id;
            """
            records = await connection.fetch(query)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching missed punches: {str(e)}")

@api_router.post("/missed-punches", response_model=MissedPunchResponse, status_code=status.HTTP_201_CREATED)
async def create_missed_punch(mp: MissedPunchCreate):
    try:
        async with pool.acquire() as connection:
            emp = await connection.fetchrow("""
                SELECT hod_name, hod_email
                FROM employee_master
                WHERE id = $1
            """, mp.emp_id)

            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")

            query = """
                INSERT INTO employee_missed_punch (
                    emp_id, punch_date, punch_type, actual_time, reason, status,
                    approved_by_name, approved_by_email,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8,
                    NOW(), NOW()
                ) RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                mp.emp_id, mp.punch_date, mp.punch_type, mp.actual_time, mp.reason, mp.status,
                emp["hod_name"], emp["hod_email"]
            )
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating missed punch: {str(e)}")

@api_router.put("/missed-punches/{missed_punch_id}", response_model=MissedPunchResponse)
async def update_missed_punch(missed_punch_id: int, mp: MissedPunchCreate):
    try:
        async with pool.acquire() as connection:
            emp = await connection.fetchrow("""
                SELECT hod_name, hod_email
                FROM employee_master
                WHERE id = $1
            """, mp.emp_id)

            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")

            query = """
                UPDATE employee_missed_punch
                SET emp_id = $1, punch_date = $2, punch_type = $3, actual_time = $4,
                    reason = $5, status = $6,
                    approved_by_name = $7, approved_by_email = $8,
                    updated_at = NOW()
                WHERE missed_punch_id = $9
                RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                mp.emp_id, mp.punch_date, mp.punch_type, mp.actual_time,
                mp.reason, mp.status,
                emp["hod_name"], emp["hod_email"],
                missed_punch_id
            )
            if not result:
                raise HTTPException(status_code=404, detail="Missed Punch not found")
            return dict(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating missed punch: {str(e)}")

@api_router.delete("/missed-punches/{missed_punch_id}")
async def delete_missed_punch(missed_punch_id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM employee_missed_punch WHERE missed_punch_id = $1;", missed_punch_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Missed punch not found")
            return {"message": "Missed punch deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting missed punch: {str(e)}")

# INTERVIEW TO JOINING ENDPOINTS

@api_router.get("/interview-joining", response_model=List[InterviewJoiningResponse])
async def get_interview_joining():
    try:
        async with pool.acquire() as connection:
            # Join interview_to_joining with designation_master
            query = """
                SELECT itj.*,
                       dm.des_name AS des_given_name
                FROM interview_to_joining itj
                LEFT JOIN designation_master dm ON itj.des_given = dm.des_id
                ORDER BY itj.id;
            """
            records = await connection.fetch(query)

            result = []
            for r in records:
                record = dict(r)

                # Convert join_date to string
                if record.get("join_date"):
                    record["join_date"] = record["join_date"].isoformat()

                # Replace des_given with the actual name
                record["des_given"] = record.get("des_given_name", "")

                # Drop helper column if you don’t want to expose both
                record.pop("des_given_name", None)

                result.append(record)
                
            return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching interview-to-joining data: {str(e)}"
        )


@api_router.post("/interview-joining", response_model=InterviewJoiningResponse, status_code=status.HTTP_201_CREATED)
async def create_interview_joining(record: InterviewJoiningCreate, background_tasks: BackgroundTasks):
    try:
        async with pool.acquire() as connection:
            query = """
                INSERT INTO interview_to_joining (
                    candidate_name, address, email, contact_number, birthdate,
                    hobbies, languages_known, strength, weakness,
                    father_name, mother_name, siblings, marital_status, spouse_name,
                    last_degree, passing_year, work_status,
                    current_employer, current_ctc, current_designation, current_joining_date,
                    current_bond, notice_period_days,
                    second_employer, second_designation, second_joining_date, second_releaving_date,
                    third_employer, third_designation, third_joining_date, third_releaving_date,
                    remarks, status, post_apply, sent_to_dept, inter_name,
                    created_at, updated_at
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                    $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,NOW(),NOW()
                )
                RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                record.candidate_name, record.address, record.email, record.contact_number, record.birthdate,
                record.hobbies, record.languages_known, record.strength, record.weakness,
                record.father_name, record.mother_name, record.siblings, record.marital_status, record.spouse_name,
                record.last_degree, record.passing_year, record.work_status,
                record.current_employer, record.current_ctc, record.current_designation, record.current_joining_date,
                record.current_bond, record.notice_period_days,
                record.second_employer, record.second_designation, record.second_joining_date, record.second_releaving_date,
                record.third_employer, record.third_designation, record.third_joining_date, record.third_releaving_date, record.remarks, record.status,
                record.post_apply, record.sent_to_dept, record.inter_name,
            )

        # ✅ Extract the trigger-populated column
        inter_email = result.get("inter_email")

        if inter_email:
            subject = f"New candidate assigned for interview"
            link = f"http://localhost:8000/api/interview-feedback/{result['id']}"
            body = f"""
            <html>
<body>
<h2>New Candidate Assigned</h2>
<table border="1" cellpadding="5" cellspacing="0">
<tr><td><b>Name</b></td><td>{result['candidate_name']}</td></tr>
<tr><td><b>Position Applied</b></td><td>{result['post_apply']}</td></tr>
<tr><td><b>Email</b></td><td>{result['email']}</td></tr>
<tr><td><b>Status</b></td><td>{result['status']}</td></tr>
</table>
<br>
<a href="{link}" 
style="display:inline-block;padding:10px 20px;color:#fff;background:#007bff;text-decoration:none;border-radius:5px;">
Fill Feedback Form
</a>
</body>
</html>
            """

            # Send email asynchronously
            background_tasks.add_task(send_email, inter_email, subject, body)

        return dict(result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating record: {str(e)}")
            

# Send email to Interviewer Email (inter_email)
def send_email(to_email: str, subject: str, body: str):
    sender = "gohilnikul83@gmail.com"
    password = "fsaw ndhj yymu ffxu"
    smtp_server = "smtp.gmail.com"
    port = 587

    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email

    with smtplib.SMTP(smtp_server, port) as server:
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)




@api_router.put("/interview-joining/{id}", response_model=InterviewJoiningResponse)
async def update_interview_joining(id: int, record: InterviewJoiningCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                UPDATE interview_to_joining
                SET candidate_name=$1, address=$2, email=$3, contact_number=$4, birthdate=$5,
                    hobbies=$6, languages_known=$7, strength=$8, weakness=$9,
                    father_name=$10, mother_name=$11, siblings=$12, marital_status=$13, spouse_name=$14,
                    last_degree=$15, passing_year=$16, work_status=$17,
                    current_employer=$18, current_ctc=$19, current_designation=$20, current_joining_date=$21,
                    current_bond=$22, notice_period_days=$23,
                    second_employer=$24, second_designation=$25, second_joining_date=$26, second_releaving_date=$27,
                    third_employer=$28, third_designation=$29, third_joining_date=$30, third_releaving_date=$31,
                    remarks=$32, status=$33,post_apply=$34, sent_to_dept=$35, inter_name=$36,
                    updated_at=NOW()
                WHERE id=$39
                RETURNING *;
            """
            result = await connection.fetchrow(
                query,
                record.candidate_name, record.address, record.email, record.contact_number, record.birthdate,
                record.hobbies, record.languages_known, record.strength, record.weakness,
                record.father_name, record.mother_name, record.siblings, record.marital_status, record.spouse_name,
                record.last_degree, record.passing_year, record.work_status,
                record.current_employer, record.current_ctc, record.current_designation, record.current_joining_date,
                record.current_bond, record.notice_period_days,
                record.second_employer, record.second_designation, record.second_joining_date, record.second_releaving_date,
                record.third_employer, record.third_designation, record.third_joining_date, record.third_releaving_date,
                record.post_apply, record.sent_to_dept, record.inter_name, record.remarks, record.status,
                id
            )

        # ✅ Extract the trigger-populated column
        inter_email = result.get("inter_email")

        if inter_email:
            subject = f"New candidate assigned for interview"
            body = f"""
            Dear {result['inter_name']},

            A new candidate has been assigned to you.

            Candidate Name: {result['candidate_name']}
            Position Applied: {result['post_apply']}
            Contact Email: {result['email']}
            Status: {result['status']}

            Regards,
            HR System
            """

            # Send email asynchronously
            background_tasks.add_task(send_email, inter_email, subject, body)

        return dict(result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating record: {str(e)}")


@api_router.delete("/interview-joining/{id}")
async def delete_interview_joining(id: int):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM interview_to_joining WHERE id=$1;", id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Record not found")
            return {"message": "Record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting record: {str(e)}")

# Interview to joining Observation feedback

@api_router.get("/interview-feedback/{candidate_id}", response_class=HTMLResponse)
async def interview_feedback_form(candidate_id: int, request: Request):
    async with pool.acquire() as connection:
        # Fetch designations
        designations = await connection.fetch("SELECT des_id, des_name FROM designation_master ORDER BY des_name")

    # Build dropdown options
    des_options = "".join([f'<option value="{d["des_id"]}">{d["des_name"]}</option>' for d in designations])

    return f"""
    <html>
      <body>
        <h2>Interview Feedback Form</h2>
        <form action="/api/submit-feedback/{candidate_id}" method="post">
          <input type="hidden" name="candidate_id" value="{candidate_id}">
          
          <label>Feedback:</label><br>
          <textarea name="feedback" rows="4" cols="50"></textarea><br><br>
          
          <label>Decision:</label><br>
          <select name="decision">
            <option value="Choose">Choose</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="On Hold">On Hold</option>
          </select><br><br>
          
          <label>Joining Date:</label><br>
          <input type="date" name="join_date"><br><br>
          
          <label>Designation:</label><br>
          <select name="des_given">
            <option value="">Choose Designation</option>
            {des_options}
          </select><br><br>
          
          <input type="submit" value="Submit Feedback">
        </form>
      </body>
    </html>
    """
@api_router.post("/submit-feedback/{candidate_id}")
async def submit_feedback(
    candidate_id: int,
    feedback: str = Form(...),
    decision: str = Form(...),
    join_date: str = Form(None),    # Optional
    des_given: int = Form(None),    # Optional
    background_tasks: BackgroundTasks = None
):
    # ✅ Convert to proper date or None
    if join_date:
        try:
            join_date_obj: date = datetime.strptime(join_date, "%Y-%m-%d").date()
        except ValueError:
            join_date_obj = None
    else:
        join_date_obj = None

    # ✅ Ensure des_given is int or None
    des_given_val = int(des_given) if des_given not in (None, "", "null") else None

    async with pool.acquire() as connection:
        result = await connection.fetchrow(
            """
            UPDATE interview_to_joining
            SET feedback = $1,
                decision = $2,
                join_date = $3,
                des_given = $4,
                status = $2,
                obser_at = NOW()
            WHERE id = $5
            RETURNING id, candidate_name, post_apply, join_date, des_given, ctc_email, status
            """,
            feedback, decision, join_date_obj, des_given_val, candidate_id
        )

    # ✅ If email exists and status is 'Selected', trigger background email
    if result and result.get("ctc_email") and result.get("status") == "Selected":
        ctc_email = result["ctc_email"]
        subject = "HR Action Required - Provide CTC & Remarks"
        link = f"http://localhost:8000/api/hr-ctc/{candidate_id}"
        body = f"""
        <html>
        <body>
            <h2>HR Action Required</h2>
            <p>Please provide the CTC details and remarks for the candidate.</p>
            <table border="1" cellpadding="5" cellspacing="0">
              <tr><td><b>Candidate</b></td><td>{result['candidate_name']}</td></tr>
              <tr><td><b>Position</b></td><td>{result['post_apply']}</td></tr>
              <tr><td><b>Status</b></td><td>{result['status']}</td></tr>
            </table>
            <br>
            <a href="{link}" 
               style="display:inline-block;padding:10px 20px;color:#fff;background:#28a745;
                      text-decoration:none;border-radius:5px;">
               Provide CTC & Remarks
            </a>
        </body>
        </html>
        """
        background_tasks.add_task(send_email, ctc_email, subject, body)

    return HTMLResponse(content=f"""
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
        <h2>✅ Thank You!</h2>
        <p>Your feedback for Candidate has been submitted successfully.</p>
      </body>
    </html>
    """)

@api_router.get("/hr-ctc/{candidate_id}", response_class=HTMLResponse)
async def hr_ctc_form(candidate_id: int):
    return f"""
    <html>
      <body>
        <h2>Enter CTC & Remarks</h2>
        <form action="/api/hr-ctc/{candidate_id}" method="post">
          <label>CTC Value:</label><br>
          <input type="text" name="ctc_value"><br><br>

          <label>HR Remarks:</label><br>
          <textarea name="hr_remarks" rows="4" cols="50"></textarea><br><br>

          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
    """

@api_router.post("/hr-ctc/{candidate_id}")
async def hr_ctc_submit(
    candidate_id: int,
    ctc_value: str = Form(...),
    hr_remarks: str = Form(...)
):
    async with pool.acquire() as connection:
        await connection.execute(
            """
            UPDATE interview_to_joining
            SET ctc_value = $1,
                hr_remarks = $2,
                ctc_at = NOW(),
                status = 'CTC Finalized',
                tat_follow = (join_date - INTERVAL '5 days') + TIME '10:00:00',
                tat_join = (join_date) + TIME '08:00:00',
                tat_apolet = (join_date + 1) + TIME '16:00:00',
                tat_bio = (join_date + 1) + TIME '16:00:00',
                tat_indtra = join_date + 3,
                tat_pf = join_date + 4,
                tat_fmonth = join_date + 30,
                tat_tmonth = join_date + 90,
                tat_smonth = join_date + 180
            WHERE id = $3
            """,
            ctc_value, hr_remarks, candidate_id
        )

    return HTMLResponse(content=f"""
    <html>
      <body style="font-family: Arial; text-align: center; margin-top: 100px;">
        <h2>✅ Thank You!</h2>
        <p>CTC & Remarks have been saved successfully.</p>
      </body>
    </html>
    """)


# Interview to Joining Other Tasks API
@app.get("/api/interview-tasks/{candidate_id}", response_class=HTMLResponse)
async def interview_tasks_form(candidate_id: int, db: asyncpg.pool.Pool = Depends(get_db_pool)):
    async with db.acquire() as connection:
        result = await connection.fetchrow(
            "SELECT status FROM interview_to_joining WHERE id=$1", candidate_id
        )

    if not result:
        return HTMLResponse("<h2>Candidate not found</h2>")

    status = result["status"]

    # Render form dynamically based on status
    if status == "CTC Finalized":
        form_html = f"""
        <h3>Fill Follow Up Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>Follow Up Time:</label>
            <input type="datetime-local" name="follow_at" required><br><br>
            <label>Follow Up Remark:</label>
            <input type="text" name="follow_remark" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    elif status == "FollowUP Done":
        form_html = f"""
        <h3>Fill Join Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>Join Time:</label>
            <input type="datetime-local" name="join_at" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    elif status == "Candidate Joined":
        form_html = f"""
        <h3>Fill Appointment Given Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>Appoinment Letter Given Time:</label>
            <input type="datetime-local" name="apolet_at" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    elif status == "Appointment Given":
        form_html = f"""
        <h3>Fill BioMetric Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>BioMetric Time:</label>
            <input type="datetime-local" name="bio_at" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    elif status == "BioMetric Done":
        form_html = f"""
        <h3>Fill Induction/Training Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>Induction/Training Time:</label>
            <input type="datetime-local" name="indtra_at" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    elif status == "Induction/Training Done":
        form_html = f"""
        <h3>Fill PF Account Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>PF Account Time:</label>
            <input type="datetime-local" name="pf_at" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    elif status == "PF Account Done":
        form_html = f"""
        <h3>Fill First Month Evalution Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>First Moneth Evalution Time:</label>
            <input type="datetime-local" name="fmonth_at" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    elif status == "First Eva. Done":
        form_html = f"""
        <h3>Fill Three Month Evalution Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>Three Month Evalution Time:</label>
            <input type="datetime-local" name="tmonth_at" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    elif status == "Second Eva. Done":
        form_html = f"""
        <h3>Fill Six Month Evalution Timestamp</h3>
        <form action="/api/interview-tasks/{candidate_id}" method="post">
            <label>Three Month Evalution Time:</label>
            <input type="datetime-local" name="smonth_at" required><br><br>
            <button type="submit">Submit</button>
        </form>
        """
    else:
        form_html = f"<h3>No action needed for status: {status}</h3>"

    return HTMLResponse(form_html)


@app.post("/api/interview-tasks/{candidate_id}", response_class=HTMLResponse)
async def interview_tasks_submit(
    candidate_id: int,
    follow_at: str = Form(None),
    follow_remark: str = Form(None),
    join_at: str = Form(None),
    apolet_at: str = Form(None),
    bio_at: str = Form(None),
    indtra_at: str = Form(None),
    pf_at: str = Form(None),
    fmonth_at: str = Form(None),
    tmonth_at: str = Form(None),
    smonth_at: str = Form(None),
    pool: Pool = Depends(get_db_pool)
):
    async with pool.acquire() as connection:
        result = await connection.fetchrow(
            "SELECT status FROM interview_to_joining WHERE id=$1", candidate_id
        )

        if not result:
            return HTMLResponse("<h2>Candidate not found</h2>")

        status = result["status"]

        # Case 1: CTC Finalized → save follow up
        if status == "CTC Finalized" and follow_at:
            # ✅ Convert str → datetime
            follow_at_dt = datetime.fromisoformat(follow_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET follow_at = $1,
                    follow_remark = $2,
                    status = 'FollowUP Done'
                WHERE id = $3
                """,
                follow_at_dt, follow_remark, candidate_id
            )
            return HTMLResponse("<h3>FollowUP Done saved!</h3>")

        # Case 2: FollowUP Done → save join timestamp
        elif status == "FollowUP Done" and join_at:
            # ✅ Convert str → datetime
            join_at_dt = datetime.fromisoformat(join_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET join_at = $1,
                    status = 'Candidate Joined'
                WHERE id = $2
                """,
                join_at_dt, candidate_id
            )
            return HTMLResponse("<h3>Candidate Joined saved!</h3>")

        # Case 3: Candidate Joined → save Appointment timestamp
        elif status == "Candidate Joined" and apolet_at:
            # ✅ Convert str → datetime
            apolet_at_dt = datetime.fromisoformat(apolet_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET apolet_at = $1,
                    status = 'Appointment Given'
                WHERE id = $2
                """,
                apolet_at_dt, candidate_id
            )
            return HTMLResponse("<h3>Candidate Appointment given!</h3>")

        # Case 4: Appointment Given → save BioMetric timestamp
        elif status == "Appointment Given" and bio_at:
            # ✅ Convert str → datetime
            bio_at_dt = datetime.fromisoformat(bio_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET bio_at = $1,
                    status = 'BioMetric Done'
                WHERE id = $2
                """,
                bio_at_dt, candidate_id
            )
            return HTMLResponse("<h3>Candidate BioMetric Done!</h3>")

        # Case 5: BioMetric Done → save Induction/Trainig timestamp
        elif status == "BioMetric Done" and indtra_at:
            # ✅ Convert str → datetime
            indtra_at_dt = datetime.fromisoformat(indtra_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET indtra_at = $1,
                    status = 'Induction/Training Done'
                WHERE id = $2
                """,
                indtra_at_dt, candidate_id
            )
            return HTMLResponse("<h3>Candidate Induction/Training Done!</h3>")

        # Case 6: Induction/Training Done → save PF Account timestamp
        elif status == "Induction/Training Done" and pf_at:
            # ✅ Convert str → datetime
            pf_at_dt = datetime.fromisoformat(pf_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET pf_at = $1,
                    status = 'PF Account Done'
                WHERE id = $2
                """,
                pf_at_dt, candidate_id
            )
            return HTMLResponse("<h3>Candidate PF Account Done!</h3>")

        # Case 7: PF Account Done → save First Month Eva timestamp
        elif status == "PF Account Done" and fmonth_at:
            # ✅ Convert str → datetime
            fmonth_at_dt = datetime.fromisoformat(fmonth_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET fmonth_at = $1,
                    status = 'First Eva. Done'
                WHERE id = $2
                """,
                fmonth_at_dt, candidate_id
            )
            return HTMLResponse("<h3>Candidate First Evalution Done!</h3>")

        # Case 8: First Evavalution Done → save Thiree Month Eva timestamp
        elif status == "First Eva. Done" and tmonth_at:
            # ✅ Convert str → datetime
            tmonth_at_dt = datetime.fromisoformat(tmonth_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET tmonth_at = $1,
                    status = 'Second Eva. Done'
                WHERE id = $2
                """,
                tmonth_at_dt, candidate_id
            )
            return HTMLResponse("<h3>Candidate Second Evalution Done!</h3>")

        # Case 9: Second Evavalution Done → save Six Month Eva timestamp
        elif status == "Second Eva. Done" and smonth_at:
            # ✅ Convert str → datetime
            smonth_at_dt = datetime.fromisoformat(smonth_at)
            await connection.execute(
                """
                UPDATE interview_to_joining
                SET smonth_at = $1,
                    status = 'Third Eva. Done'
                WHERE id = $2
                """,
                smonth_at_dt, candidate_id
            )
            return HTMLResponse("<h3>Candidate Third Evalution Done!</h3>")

        else:
            return HTMLResponse("<h3>No action needed or invalid input</h3>")

# Resignation to Releaving EndPoints

@api_router.get("/resignations", response_model=List[ResignationResponse])
async def get_resignations():
    try:
        async with pool.acquire() as conn:
            records = await conn.fetch("""
                SELECT * FROM resignation_master
                ORDER BY resignation_id DESC;
            """)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching resignations: {str(e)}"
        )


# ---------------------------
# Submit Resignation
# ---------------------------
@api_router.post("/resignations", response_model=ResignationResponse)
async def submit_resignation(
    resignation: ResignationCreate,
    background_tasks: BackgroundTasks
):
    try:
        async with pool.acquire() as conn:
            result = await conn.fetchrow("""
                INSERT INTO resignation_master (
                    emp_code, emp_name, dept_name, des_name,
                    hod_name, hod_email, resignation_date,
                    reason, status, task_status, created_at, updated_at, tat_app
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $9,
                    NOW(), NOW(), NOW() + INTERVAL '2 days'
                )
                RETURNING *;
            """,
                resignation.emp_code,
                resignation.emp_name,
                resignation.dept_name,
                resignation.des_name,
                resignation.hod_name,
                resignation.hod_email,
                resignation.resignation_date,
                resignation.reason,
                resignation.status
            )

            # Send approval email to HOD
            approval_link = f"http://localhost:8000/api/resignations/{result['resignation_id']}/approval"
            subject = f"Resignation Approval Required: Employee {resignation.emp_code}"
            body = f"""
                <html>
                <body>
                    <h2>Resignation Submitted</h2>
                    <p>Dear Mr.{resignation.hod_name},</p>
                    <p>An employee has submitted a resignation. Please review and take action.</p>
                    <table border="1" cellpadding="5" cellspacing="0">
                        <tr><td><b>Employee Name</b></td><td>{resignation.emp_name}</td></tr>
                        <tr><td><b>Employee Code</b></td><td>{resignation.emp_code}</td></tr>
                        <tr><td><b>Department</b></td><td>{resignation.dept_name}</td></tr>
                        <tr><td><b>Designation</b></td><td>{resignation.des_name}</td></tr>
                        <tr><td><b>Resignation Date</b></td><td>{resignation.resignation_date}</td></tr>
                        <tr><td><b>Status</b></td><td>Pending</td></tr>
                        <tr><td><b>Reason</b></td><td>{resignation.reason}</td></tr>
                    </table>
                    <br>
                    <a href="{approval_link}"
                       style="display:inline-block;padding:10px 20px;color:#fff;background:#007bff;
                              text-decoration:none;border-radius:5px;">
                        Approve / Reject
                    </a>
                </body>
                </html>
            """
            background_tasks.add_task(send_email, resignation.hod_email, subject, body)

            return dict(result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting resignation: {str(e)}"
        )


# ---------------------------
# HOD Approval Form (HTML)
# ---------------------------
@api_router.get("/resignations/{resignation_id}/approval", response_class=HTMLResponse)
async def resignation_approval_form(resignation_id: int):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM resignation_master WHERE resignation_id=$1;",
            resignation_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Resignation not found")

        html = f"""
            <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f9;
                        padding: 20px;
                    }}
                    .card {{
                        background: #fff;
                        max-width: 600px;
                        margin: auto;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }}
                    h2 {{
                        color: #007bff;
                        text-align: center;
                    }}
                    label {{
                        font-weight: bold;
                        margin-top: 10px;
                        display: block;
                    }}
                    select, input[type="date"], textarea {{
                        width: 100%;
                        padding: 10px;
                        margin-top: 5px;
                        border-radius: 5px;
                        border: 1px solid #ccc;
                        box-sizing: border-box;
                    }}
                    button {{
                        display: block;
                        width: 100%;
                        padding: 12px;
                        background-color: #28a745;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 20px;
                    }}
                    button:hover {{
                        background-color: #218838;
                    }}
                    .note {{
                        font-size: 12px;
                        color: #555;
                        margin-top: 10px;
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Resignation Approval for Employee {row['emp_code']}</h2>
                    <form method="post" action="/api/resignations/{resignation_id}/approval">
                        <label>Decision:</label>
                        <select name="status" required onchange="toggleReleaving(this.value)">
                            <option value="">--Select--</option>
                            <option value="Approved">Approve</option>
                            <option value="Rejected">Reject</option>
                        </select>

                        <label>Releaving Date:</label>
                        <input type="date" name="releaving_date" id="releaving_date" disabled>

                        <label>Remarks:</label>
                        <textarea name="remarks" rows="4" placeholder="Enter remarks here..."></textarea>

                        <button type="submit">Submit Decision</button>
                    </form>
                    <p class="note">* Releaving date is required only if approving the resignation.</p>
                </div>

                <script>
                    function toggleReleaving(value) {{
                        document.getElementById("releaving_date").disabled = (value !== "Approved");
                    }}
                </script>
            </body>
            </html>
        """
        return HTMLResponse(html)


# ---------------------------
# Submit HOD Approval
# ---------------------------
@api_router.post("/resignations/{resignation_id}/approval")
async def submit_resignation_approval(
    resignation_id: int,
    status: str = Form(...),
    releaving_date: Optional[date] = Form(None),
    remarks: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None
):
    try:
        async with pool.acquire() as conn:
            # Fetch HR email with proper JOINs
            hr_email = await conn.fetchval("""
                SELECT e.emp_official_email
                FROM employee_master e
                INNER JOIN designation_master d ON e.des_id = d.des_id
                INNER JOIN department_master dept ON e.dept_id = dept.dept_id
                INNER JOIN division_master div ON e.divn_id = div.divn_id
                WHERE dept.dept_name='HR & Admin'
                  AND d.des_name='Manager'
                  AND e.status='Active'
                LIMIT 1;
            """)

            # Fallback if no HR email found
            if not hr_email:
                hr_email = None

            # Update resignation_master
            row = await conn.fetchrow("""
                UPDATE resignation_master
                SET status=$1, releaving_date=$2, remarks=$3,
                    hr_email=$4, app_at=NOW(), task_status=$1
                WHERE resignation_id=$5
                RETURNING *;
            """, status, releaving_date, remarks, hr_email, resignation_id)

            if not row:
                raise HTTPException(status_code=404, detail="Resignation not found")

            # Notify HR if approved
            if status.lower() == "approved" and hr_email:
                subject = f"Resignation Approved: {row['emp_code']}"
                body = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #28a745;">Resignation Approved</h2>
                        <p>Dear HR,</p>
                        <p>The resignation of the following employee has been
                           <b style="color:#28a745;">Approved</b> by the HOD:</p>
                        <table border="1" cellpadding="8" cellspacing="0"
                               style="border-collapse: collapse; width: 100%;">
                            <tr style="background-color:#f2f2f2;">
                                <td><b>Employee Name</b></td><td>{row['emp_name']}</td>
                            </tr>
                            <tr>
                                <td><b>Employee Code</b></td><td>{row['emp_code']}</td>
                            </tr>
                            <tr>
                                <td><b>Department</b></td><td>{row['dept_name']}</td>
                            </tr>
                            <tr>
                                <td><b>Designation</b></td><td>{row['des_name']}</td>
                            </tr>
                            <tr>
                                <td><b>Resignation Date</b></td><td>{row['resignation_date']}</td>
                            </tr>
                            <tr>
                                <td><b>Releaving Date</b></td><td>{releaving_date or 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><b>Remarks</b></td><td>{remarks or 'N/A'}</td>
                            </tr>
                        </table>
                        <br>
                        <p style="margin-top:20px;">
                            Please proceed with the required exit formalities.
                        </p>
                        <p style="color:#555; font-size:12px; margin-top:30px;">
                            This is an automated notification. Please do not reply directly to this email.
                        </p>
                    </body>
                    </html>
                """
                background_tasks.add_task(send_email, hr_email, subject, body)

            return {"message": f"Resignation {status} successfully."}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error approving resignation: {str(e)}"
        )


# ---------------------------
# Delete Resignation
# ---------------------------
@api_router.delete("/resignations/{resignation_id}")
async def delete_resignation(resignation_id: int):
    try:
        async with pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM resignation_master WHERE resignation_id=$1;",
                resignation_id
            )
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Resignation not found")

            return {"message": "Resignation deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting resignation: {str(e)}"
        )
# ---------------------------
# Resignation Tasks Form (HTML)
# ---------------------------
@api_router.get("/resignation-tasks/{resignation_id}", response_class=HTMLResponse)
async def resignation_tasks_form(resignation_id: int):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM resignation_master WHERE resignation_id=$1",
            resignation_id
        )

        if not row:
            return HTMLResponse("<h2>Resignation not found</h2>")

        status = row['status']

        # Determine form dynamically based on status
        if status == "Pending":
            form_html = f"""
            <h3>HOD Approval Pending</h3>
            <p>No further action is required until HOD approves/rejects this resignation.</p>
            """
        elif status == "Approved":
            form_html = f"""
            <h3>Fill Exit Interview Details</h3>
            <form action="/api/resignation-tasks/{resignation_id}" method="post">
                <label>Exit Interview Date:</label>
                <input type="datetime-local" name="exint_at" required><br><br>
                <a href="/static/exit_interview.html?resignation_id={resignation_id}" target="_blank">
                    Click here to fill the form
                </a>
                <button type="submit">Submit</button>
            </form>
            """
        elif status == "Exit Interview Done":
            form_html = f"""
            <h3>Complete No Due Form</h3>
            <form action="/api/resignation-tasks/{resignation_id}" method="post">
                <label>No Due Clearance Date:</label>
                <input type="datetime-local" name="nodue_at" required><br><br>
                <button type="submit">Submit</button>
            </form>
            """
        elif status == "No Due Done":
            form_html = f"""
            <h3>Mark Releaving Done</h3>
            <form action="/api/resignation-tasks/{resignation_id}" method="post">
                <label>Releaving Date:</label>
                <input type="datetime-local" name="rel_at" required><br><br>
                <button type="submit">Submit</button>
            </form>
            """
        elif status == "Releaving Done":
            form_html = f"""
            <h3>Fill F&F Done</h3>
            <form action="/api/resignation-tasks/{resignation_id}" method="post">
                <label>F&F Completion Date:</label>
                <input type="datetime-local" name="fnf_at" required><br><br>
                <label>Cheque No:</label>
                <input type="number" name="cheqno" required><br><br>
                <label>Cheque Amount:</label>
                <input type="number" name="cheqamt" required><br><br>
                <button type="submit">Submit</button>
            </form>
            """
        elif status == "F&F Done":
            form_html = f"""
            <h3>Final Approval</h3>
            <form action="/api/resignation-tasks/{resignation_id}" method="post">
                <label>Final Approval Date:</label>
                <input type="datetime-local" name="finapp_at" required><br><br>
                <label>HR Remarks:</label>
                <input type="text" name="hr_remark" required><br><br>
                <button type="submit">Submit</button>
            </form>
            """
        elif status == "Final Approval":
            form_html = "<h3>No further action required. This resignation is fully completed.</h3>"
        else:
            form_html = f"<h3>No action needed for status: {status}</h3>"

        return HTMLResponse(form_html)


# ---------------------------
# Submit Resignation Task
# ---------------------------

@api_router.post("/resignation-tasks/{resignation_id}", response_class=HTMLResponse)
async def resignation_tasks_submit(
    resignation_id: int,
    exint_at: str = Form(None),
    nodue_at: str = Form(None),
    rel_at: str = Form(None),
    fnf_at: str = Form(None),
    finapp_at: str = Form(None),
    cheqno: int = Form(None),
    cheqamt: int = Form(None),
    hr_remark: str = Form(None)
):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT status FROM resignation_master WHERE resignation_id=$1",
            resignation_id
        )

        if not row:
            return HTMLResponse("<h2>Resignation not found</h2>")

        status = row["status"]

        # Convert strings to datetime objects
        exint_dt = datetime.fromisoformat(exint_at) if exint_at else None
        nodue_dt = datetime.fromisoformat(nodue_at) if nodue_at else None
        rel_dt = datetime.fromisoformat(rel_at) if rel_at else None
        fnf_dt = datetime.fromisoformat(fnf_at) if fnf_at else None
        finapp_dt = datetime.fromisoformat(finapp_at) if finapp_at else None

        if status == "Approved" and exint_dt:
            await conn.execute("""
                UPDATE resignation_master
                SET status='Exit Interview Done',
                    exint_at=$1,
                    updated_at=NOW()
                WHERE resignation_id=$2
            """, exint_dt, resignation_id)
            return HTMLResponse("<h3>Exit Interview Done saved!</h3>")

        elif status == "Exit Interview Done" and nodue_dt:
            await conn.execute("""
                UPDATE resignation_master
                SET status='No Due Done',
                    nodue_at=$1,
                    updated_at=NOW()
                WHERE resignation_id=$2
            """, nodue_dt, resignation_id)
            return HTMLResponse("<h3>No Due Done saved!</h3>")

        elif status == "No Due Done" and rel_dt:
            await conn.execute("""
                UPDATE resignation_master
                SET status='Releaving Done',
                    rel_at=$1,
                    updated_at=NOW()
                WHERE resignation_id=$2
            """, rel_dt, resignation_id)
            return HTMLResponse("<h3>Releaving Done saved!</h3>")

        elif status == "Releaving Done" and fnf_dt:
            await conn.execute("""
                UPDATE resignation_master
                SET status='F&F Done',
                    fnf_at=$1,
                    cheqno=$2,
                    cheqamt=$3,
                    updated_at=NOW()
                WHERE resignation_id=$4
            """, fnf_dt, cheqno, cheqamt, resignation_id)
            return HTMLResponse("<h3>F&F Done saved!</h3>")

        elif status == "F&F Done" and finapp_dt:
            await conn.execute("""
                UPDATE resignation_master
                SET status='Final Approval',
                    finapp_at=$1,
                    hr_remark=$2,
                    updated_at=NOW()
                WHERE resignation_id=$3
            """, finapp_dt, hr_remark, resignation_id)
            return HTMLResponse("<h3>Final Approval done!</h3>")

        else:
            return HTMLResponse(f"<h3>No action needed or missing input for status: {status}</h3>")

# Business Partner EndPoints

# GET all business partners
@api_router.get("/business-partners", response_model=List[BusinessPartnerResponse])
async def get_business_partners():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    bm.*,
                    bptype.bptype_name,
                    bpgroup.bpgroup_name,
                    bank.bank_name
                FROM business_master bm
                LEFT JOIN bp_type_ref bptype ON bm.bptype_id = bptype.bptype_id
                LEFT JOIN bp_group_ref bpgroup ON bm.bpgroup_id = bpgroup.bpgroup_id
                LEFT JOIN bank_master bank ON bm.bank_id = bank.bank_id
                ORDER BY bm.bpcode;
            """
            records = await connection.fetch(query)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching business partners: {str(e)}")


# GET single business partner by bpcode
@api_router.get("/business-partners/{bpcode}", response_model=BusinessPartnerResponse)
async def get_business_partner(bpcode: str):
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    bm.*,
                    bptype.bptype_name,
                    bpgroup.bpgroup_name,
                    bank.bank_name
                FROM business_master bm
                LEFT JOIN bp_type_ref bptype ON bm.bptype_id = bptype.bptype_id
                LEFT JOIN bp_group_ref bpgroup ON bm.bpgroup_id = bpgroup.bpgroup_id
                LEFT JOIN bank_master bank ON bm.bank_id = bank.bank_id
                WHERE bm.bpcode = $1
            """
            record = await connection.fetchrow(query, bpcode)
            if not record:
                raise HTTPException(status_code=404, detail="Business Partner not found")
            return dict(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching business partner: {str(e)}")


# CREATE Business Partner
@api_router.post("/business-partners", response_model=BusinessPartnerResponse, status_code=status.HTTP_201_CREATED)
async def create_business_partner(bp: BusinessPartnerCreate):
    try:
        async with pool.acquire() as connection:

            # --- Foreign key validations ---
            if bp.bptype_id:
                type_exists = await connection.fetchrow(
                    "SELECT bptype_id FROM bp_type_ref WHERE bptype_id = $1;", bp.bptype_id
                )
                if not type_exists:
                    raise HTTPException(status_code=400, detail=f"BP Type with ID {bp.bptype_id} does not exist")

            if bp.bpgroup_id:
                group_exists = await connection.fetchrow(
                    "SELECT bpgroup_id FROM bp_group_ref WHERE bpgroup_id = $1;", bp.bpgroup_id
                )
                if not group_exists:
                    raise HTTPException(status_code=400, detail=f"BP Group with ID {bp.bpgroup_id} does not exist")

            if bp.bank_id:
                bank_exists = await connection.fetchrow(
                    "SELECT bank_id FROM bank_master WHERE bank_id = $1;", bp.bank_id
                )
                if not bank_exists:
                    raise HTTPException(status_code=400, detail=f"Bank with ID {bp.bank_id} does not exist")

            # --- Insert the business partner ---
            insert_query = """
                INSERT INTO business_master (
                    bptype_id, bpgroup_id, bpname, phone, mobile, email, website,
                    pan_no, tan_no, tin_no, msme_no, cp_name, cp_mobile, cp_email,
                    paddressline1, paddressline2, paddressline3, paddressline4, paddressline5,
                    pcity, pzipcode, pstate, pcountry, pgstrno, pgsttype_id,
                    saddressline1, saddressline2, saddressline3, saddressline4, saddressline5,
                    scity, szipcode, sstate, scountry, sgstrno, sgsttype_id,
                    bank_id, account_name, account_number, ifsc_code, bank_branch, bank_city, bank_state, bank_country,
                    remarks, cp_dob, cp_desi
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
                    $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
                    $27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,
                    $38,$39,$40,$41,$42,$43,$44,$45,$46,$47
                ) RETURNING bpcode;
            """

            params = [
                bp.bptype_id or None, bp.bpgroup_id or None, bp.bpname or None,
                bp.phone or None, bp.mobile or None, bp.email or None, bp.website or None,
                bp.pan_no or None, bp.tan_no or None, bp.tin_no or None, bp.msme_no or None,
                bp.cp_name or None, bp.cp_mobile or None, bp.cp_email or None,
                bp.paddressline1 or None, bp.paddressline2 or None, bp.paddressline3 or None, bp.paddressline4 or None, bp.paddressline5 or None,
                bp.pcity or None, bp.pzipcode or None, bp.pstate or None, bp.pcountry or None, bp.pgstrno or None, bp.pgsttype_id or None,
                bp.saddressline1 or None, bp.saddressline2 or None, bp.saddressline3 or None, bp.saddressline4 or None, bp.saddressline5 or None,
                bp.scity or None, bp.szipcode or None, bp.sstate or None, bp.scountry or None, bp.sgstrno or None, bp.sgsttype_id or None,
                bp.bank_id or None, bp.account_name or None, bp.account_number or None, bp.ifsc_code or None,
                bp.bank_branch or None, bp.bank_city or None, bp.bank_state or None, bp.bank_country or None,
                bp.remarks or None, bp.cp_dob or None, bp.cp_desi or None
            ]

            inserted = await connection.fetchrow(insert_query, *params)
            bpcode = inserted['bpcode']

            # --- Fetch full record with display names for front-end ---
            full_query = """
                SELECT bm.*, bpt.bptype_name, bpg.bpgroup_name, bk.bank_name
                FROM business_master bm
                LEFT JOIN bp_type_ref bpt ON bm.bptype_id = bpt.bptype_id
                LEFT JOIN bp_group_ref bpg ON bm.bpgroup_id = bpg.bpgroup_id
                LEFT JOIN bank_master bk ON bm.bank_id = bk.bank_id
                WHERE bm.bpcode = $1
            """
            full_record = await connection.fetchrow(full_query, bpcode)
            return dict(full_record)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating business partner: {str(e)}")


# UPDATE business partner
@api_router.put("/business-partners/{bpcode}", response_model=BusinessPartnerResponse)
async def update_business_partner(bpcode: str, bp: BusinessPartnerCreate):
    try:
        async with pool.acquire() as connection:
            query = """
                UPDATE business_master SET
                    bptype_id=$1, bpgroup_id=$2, bpname=$3, phone=$4, mobile=$5, email=$6, website=$7,
                    pan_no=$8, tan_no=$9, tin_no=$10, msme_no=$11, cp_name=$12, cp_mobile=$13, cp_email=$14,
                    paddressline1=$15, paddressline2=$16, paddressline3=$17, paddressline4=$18, paddressline5=$19,
                    pcity=$20, pzipcode=$21, pstate=$22, pcountry=$23, pgstrno=$24, pgsttype_id=$25,
                    saddressline1=$26, saddressline2=$27, saddressline3=$28, saddressline4=$29, saddressline5=$30,
                    scity=$31, szipcode=$32, sstate=$33, scountry=$34, sgstrno=$35, sgsttype_id=$36,
                    bank_id=$37, account_name=$38, account_number=$39, ifsc_code=$40, bank_branch=$41, bank_city=$42, bank_state=$43, bank_country=$44,
                    remarks=$45, cp_dob=$46, cp_desi=$47
                WHERE bpcode=$48
                RETURNING *;
            """
            record = await connection.fetchrow(
                query,
                bp.bptype_id, bp.bpgroup_id, bp.bpname, bp.phone, bp.mobile, bp.email, bp.website,
                bp.pan_no, bp.tan_no, bp.tin_no, bp.msme_no, bp.cp_name, bp.cp_mobile, bp.cp_email,
                bp.paddressline1, bp.paddressline2, bp.paddressline3, bp.paddressline4, bp.paddressline5,
                bp.pcity, bp.pzipcode, bp.pstate, bp.pcountry, bp.pgstrno, bp.pgsttype_id,
                bp.saddressline1, bp.saddressline2, bp.saddressline3, bp.saddressline4, bp.saddressline5,
                bp.scity, bp.szipcode, bp.sstate, bp.scountry, bp.sgstrno, bp.sgsttype_id,
                bp.bank_id, bp.account_name, bp.account_number, bp.ifsc_code, bp.bank_branch, bp.bank_city, bp.bank_state, bp.bank_country,
                bp.remarks, bp.cp_dob, bp.cp_desi,
                bpcode
            )
            if not record:
                raise HTTPException(status_code=404, detail="Business Partner not found")
            return dict(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating business partner: {str(e)}")


# DELETE business partner
@api_router.delete("/business-partners/{bpcode}")
async def delete_business_partner(bpcode: str):
    try:
        async with pool.acquire() as connection:
            result = await connection.execute("DELETE FROM business_master WHERE bpcode=$1;", bpcode)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Business Partner not found")
            return {"message": "Business Partner deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting business partner: {str(e)}")

# Item Master EndPoints

# Reference data endpoints for Item Master
@api_router.get("/item-groups")
async def get_item_groups():
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT * FROM item_group ORDER BY grp_name;")
        return [dict(r) for r in records]

@api_router.get("/item-uoms")
async def get_item_uoms():
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT * FROM uom ORDER BY uom_name;")
        return [dict(r) for r in records]

@api_router.get("/item-categories")
async def get_item_categories():
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT * FROM item_cat ORDER BY cat_name;")
        return [dict(r) for r in records]

@api_router.get("/item-types")
async def get_item_types():
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT * FROM item_type ORDER BY type_name;")
        return [dict(r) for r in records]

@api_router.get("/warehouses")
async def get_warehouses():
    async with pool.acquire() as conn:
        records = await conn.fetch("SELECT * FROM whs ORDER BY whs_name;")
        return [dict(r) for r in records]

# Item Master CRUD endpoints
@api_router.get("/items", response_model=List[ItemMasterResponse])
async def get_items():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    im.it_id,
                    im.it_code,
                    im.it_name,
                    im.it_details,
                    im.it_group,
                    im.it_uom,
                    im.it_type,
                    im.it_mfg,
                    im.it_hsn,
                    im.it_whs,
                    im.it_moq,
                    im.it_min,
                    im.it_max,
                    im.it_lead,
                    im.it_status,
                    im.it_remark,
                    im.it_attach,
                    ig.grp_name as group_name,
                    uom.uom_name,
                    it.type_name,
                    wr.whs_name,
                    0 as current_stock,
                    COALESCE(ARRAY_AGG(ic.cat_name) FILTER (WHERE ic.cat_name IS NOT NULL), ARRAY[]::text[]) as category_names,
                    COALESCE(ARRAY_AGG(ic.cat_id) FILTER (WHERE ic.cat_id IS NOT NULL), ARRAY[]::int[]) as category_ids
                FROM item_master im
                LEFT JOIN item_group ig ON im.it_group = ig.grp_id
                LEFT JOIN uom uom ON im.it_uom = uom.uom_id
                LEFT JOIN item_category_mapping icm ON im.it_id = icm.item_id
                LEFT JOIN item_cat ic ON icm.category_id = ic.cat_id
                LEFT JOIN item_type it ON im.it_type = it.type_id
                LEFT JOIN whs wr ON im.it_whs = wr.whs_id
                GROUP BY im.it_id, im.it_code, im.it_name, im.it_details, im.it_group, im.it_uom, 
                         im.it_type, im.it_mfg, im.it_hsn, im.it_whs, im.it_moq, im.it_min, 
                         im.it_max, im.it_lead, im.it_status, im.it_remark, im.it_attach,
                         ig.grp_name, uom.uom_name, it.type_name, wr.whs_name
                ORDER BY im.it_code;
            """
            records = await connection.fetch(query)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching items: {str(e)}")

@api_router.get("/items/{it_id}", response_model=ItemMasterResponse)
async def get_item(it_id: int):
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    im.it_id,
                    im.it_code,
                    im.it_name,
                    im.it_details,
                    im.it_group,
                    im.it_uom,
                    im.it_type,
                    im.it_mfg,
                    im.it_hsn,
                    im.it_whs,
                    im.it_moq,
                    im.it_min,
                    im.it_max,
                    im.it_lead,
                    im.it_status,
                    im.it_remark,
                    im.it_attach,
                    ig.grp_name as group_name,
                    uom.uom_name,
                    it.type_name,
                    wr.whs_name,
                    0 as current_stock,
                    COALESCE(ARRAY_AGG(ic.cat_name) FILTER (WHERE ic.cat_name IS NOT NULL), ARRAY[]::text[]) as category_names,
                    COALESCE(ARRAY_AGG(ic.cat_id) FILTER (WHERE ic.cat_id IS NOT NULL), ARRAY[]::int[]) as category_ids
                FROM item_master im
                LEFT JOIN item_group ig ON im.it_group = ig.grp_id
                LEFT JOIN uom uom ON im.it_uom = uom.uom_id
                LEFT JOIN item_category_mapping icm ON im.it_id = icm.item_id
                LEFT JOIN item_cat ic ON icm.category_id = ic.cat_id
                LEFT JOIN item_type it ON im.it_type = it.type_id
                LEFT JOIN whs wr ON im.it_whs = wr.whs_id
                WHERE im.it_id = $1
                GROUP BY im.it_id, im.it_code, im.it_name, im.it_details, im.it_group, im.it_uom, 
                         im.it_type, im.it_mfg, im.it_hsn, im.it_whs, im.it_moq, im.it_min, 
                         im.it_max, im.it_lead, im.it_status, im.it_remark, im.it_attach,
                         ig.grp_name, uom.uom_name, it.type_name, wr.whs_name
            """
            record = await connection.fetchrow(query, it_id)
            if not record:
                raise HTTPException(status_code=404, detail="Item not found")
            return dict(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching item: {str(e)}")

@api_router.post("/items", response_model=ItemMasterResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemMasterCreate):
    try:
        async with pool.acquire() as connection:

            # Foreign key validations
            if item.it_group:
                group_exists = await connection.fetchrow(
                    "SELECT grp_id FROM item_group WHERE grp_id = $1;", item.it_group
                )
                if not group_exists:
                    raise HTTPException(status_code=400, detail=f"Item Group with ID {item.it_group} does not exist")

            if item.it_uom:
                uom_exists = await connection.fetchrow(
                    "SELECT uom_id FROM uom WHERE uom_id = $1;", item.it_uom
                )
                if not uom_exists:
                    raise HTTPException(status_code=400, detail=f"UOM with ID {item.it_uom} does not exist")

            # Validate categories
            if item.category_ids:
                for cat_id in item.category_ids:
                    category_exists = await connection.fetchrow(
                        "SELECT cat_id FROM item_cat WHERE cat_id = $1;", cat_id
                    )
                    if not category_exists:
                        raise HTTPException(status_code=400, detail=f"Category with ID {cat_id} does not exist")

            if item.it_type:
                type_exists = await connection.fetchrow(
                    "SELECT type_id FROM item_type WHERE type_id = $1;", item.it_type
                )
                if not type_exists:
                    raise HTTPException(status_code=400, detail=f"Type with ID {item.it_type} does not exist")

            if item.it_whs:
                whs_exists = await connection.fetchrow(
                    "SELECT whs_id FROM whs WHERE whs_id = $1;", item.it_whs
                )
                if not whs_exists:
                    raise HTTPException(status_code=400, detail=f"Warehouse with ID {item.it_whs} does not exist")

            # Insert the item
            insert_query = """
                INSERT INTO item_master (
                    it_name, it_details, it_group, it_uom, it_type,
                    it_mfg, it_hsn, it_whs, it_moq, it_min, it_max, it_lead,
                    it_status, it_remark, it_attach
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                ) RETURNING it_id;
            """

            params = [
                item.it_name, item.it_details or None, item.it_group or None, 
                item.it_uom or None, item.it_type or None,
                item.it_mfg or None, item.it_hsn or None, item.it_whs or None,
                item.it_moq or 0, item.it_min or 0, item.it_max or 0, item.it_lead or 0,
                item.it_status, item.it_remark or None, item.it_attach or None
            ]

            inserted = await connection.fetchrow(insert_query, *params)
            it_id = inserted['it_id']

            # Insert category mappings
            if item.category_ids:
                for cat_id in item.category_ids:
                    await connection.execute(
                        "INSERT INTO item_category_mapping (item_id, category_id) VALUES ($1, $2)",
                        it_id, cat_id
                    )

            # Fetch full record with display names
            return await get_item(it_id)

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating item: {str(e)}")

@api_router.put("/items/{it_id}", response_model=ItemMasterResponse)
async def update_item(it_id: int, item: ItemMasterCreate):
    try:
        async with pool.acquire() as connection:
            # Update main item
            query = """
                UPDATE item_master SET
                    it_name=$1, it_details=$2, it_group=$3, it_uom=$4, it_type=$5,
                    it_mfg=$6, it_hsn=$7, it_whs=$8, it_moq=$9, it_min=$10, it_max=$11, it_lead=$12,
                    it_status=$13, it_remark=$14, it_attach=$15
                WHERE it_id=$16
                RETURNING it_id;
            """
            
            result = await connection.fetchrow(
                query,
                item.it_name, item.it_details or None, item.it_group or None, 
                item.it_uom or None, item.it_type or None,
                item.it_mfg or None, item.it_hsn or None, item.it_whs or None,
                item.it_moq or 0, item.it_min or 0, item.it_max or 0, item.it_lead or 0,
                item.it_status, item.it_remark or None, item.it_attach or None,
                it_id
            )
            
            if not result:
                raise HTTPException(status_code=404, detail="Item not found")

            # Update categories - delete existing and insert new
            await connection.execute("DELETE FROM item_category_mapping WHERE item_id = $1", it_id)
            
            if item.category_ids:
                for cat_id in item.category_ids:
                    await connection.execute(
                        "INSERT INTO item_category_mapping (item_id, category_id) VALUES ($1, $2)",
                        it_id, cat_id
                    )

            # Fetch updated record
            return await get_item(it_id)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating item: {str(e)}")

@api_router.delete("/items/{it_id}")
async def delete_item(it_id: int):
    try:
        async with pool.acquire() as connection:
            # Categories will be automatically deleted due to CASCADE
            result = await connection.execute("DELETE FROM item_master WHERE it_id=$1;", it_id)
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Item not found")
            return {"message": "Item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting item: {str(e)}")


# Stock Transaction API Endpoints

@api_router.post("/stock-transactions", response_model=StockTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_transaction(transaction: StockTransactionCreate):
    try:
        async with pool.acquire() as connection:
            # Validate item exists
            item_exists = await connection.fetchrow(
                "SELECT it_id FROM item_master WHERE it_id = $1;", transaction.item_id
            )
            if not item_exists:
                raise HTTPException(status_code=400, detail=f"Item with ID {transaction.item_id} does not exist")
            
            # Validate warehouse if provided
            if transaction.warehouse_id:
                warehouse_exists = await connection.fetchrow(
                    "SELECT whs_id FROM whs WHERE whs_id = $1;", transaction.warehouse_id
                )
                if not warehouse_exists:
                    raise HTTPException(status_code=400, detail=f"Warehouse with ID {transaction.warehouse_id} does not exist")
            
            # Calculate running balance
            last_balance_query = """
                SELECT balance_qty FROM stock_transactions 
                WHERE item_id = $1 AND warehouse_id = $2 
                ORDER BY trans_date DESC, trans_id DESC 
                LIMIT 1
            """
            last_balance = await connection.fetchrow(
                last_balance_query, 
                transaction.item_id, 
                transaction.warehouse_id
            )
            
            current_balance = last_balance['balance_qty'] if last_balance else 0
            
            if transaction.trans_type == 'IN':
                new_balance = current_balance + transaction.stock_qty
            elif transaction.trans_type == 'OUT':
                new_balance = current_balance - transaction.stock_qty
            else:  # ADJUSTMENT
                new_balance = transaction.stock_qty
            
            # Insert transaction
            insert_query = """
                INSERT INTO stock_transactions (
                    item_id, trans_type, reference_type, reference_id, warehouse_id,
                    stock_qty, unit_cost, balance_qty, remarks, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING trans_id;
            """
            
            inserted = await connection.fetchrow(
                insert_query,
                transaction.item_id,
                transaction.trans_type,
                transaction.reference_type,
                transaction.reference_id,
                transaction.warehouse_id,
                transaction.stock_qty,
                transaction.unit_cost or 0,
                new_balance,
                transaction.remarks,
                transaction.created_by
            )
            
            # Fetch complete record with item details
            full_query = """
                SELECT st.*, im.it_code, im.it_name, wr.whs_name
                FROM stock_transactions st
                LEFT JOIN item_master im ON st.item_id = im.it_id
                LEFT JOIN whs wr ON st.warehouse_id = wr.whs_id
                WHERE st.trans_id = $1
            """
            full_record = await connection.fetchrow(full_query, inserted['trans_id'])
            return dict(full_record)
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating stock transaction: {str(e)}")

@api_router.get("/stock-transactions")
async def get_stock_transactions(
    item_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100
):
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT st.*, im.it_code, im.it_name, wr.whs_name
                FROM stock_transactions st
                LEFT JOIN item_master im ON st.item_id = im.it_id
                LEFT JOIN whs wr ON st.warehouse_id = wr.whs_id
                WHERE 1=1
            """
            params = []
            param_count = 0
            
            if item_id:
                param_count += 1
                query += f" AND st.item_id = ${param_count}"
                params.append(item_id)
            
            if warehouse_id:
                param_count += 1
                query += f" AND st.warehouse_id = ${param_count}"
                params.append(warehouse_id)
            
            if start_date:
                param_count += 1
                query += f" AND DATE(st.trans_date) >= ${param_count}"
                params.append(start_date)
            
            if end_date:
                param_count += 1
                query += f" AND DATE(st.trans_date) <= ${param_count}"
                params.append(end_date)
            
            query += " ORDER BY st.trans_date DESC, st.trans_id DESC"
            query += f" LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
            params.extend([limit, skip])
            
            records = await connection.fetch(query, *params)
            return [dict(r) for r in records]
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock transactions: {str(e)}")

@api_router.get("/current-stock/{item_id}")
async def get_current_stock(item_id: int, warehouse_id: Optional[int] = None):
    try:
        async with pool.acquire() as connection:
            # Validate item exists
            item_exists = await connection.fetchrow(
                "SELECT it_id FROM item_master WHERE it_id = $1;", item_id
            )
            if not item_exists:
                raise HTTPException(status_code=404, detail="Item not found")
            
            query = """
                SELECT balance_qty FROM stock_transactions 
                WHERE item_id = $1
            """
            params = [item_id]
            
            if warehouse_id:
                query += " AND warehouse_id = $2"
                params.append(warehouse_id)
            
            query += " ORDER BY trans_date DESC, trans_id DESC LIMIT 1"
            
            record = await connection.fetchrow(query, *params)
            current_stock = record['balance_qty'] if record else 0
            
            return {
                "item_id": item_id,
                "warehouse_id": warehouse_id,
                "current_stock": current_stock
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching current stock: {str(e)}")

# Posting Periods Endpoints
@api_router.get("/posting-periods", response_model=List[PostingPeriodResponse])
async def get_posting_periods():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT * FROM posting_periods 
                ORDER BY fiscal_year DESC, start_date DESC;
            """
            records = await connection.fetch(query)
            return [dict(r) for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching posting periods: {str(e)}")

@api_router.get("/posting-periods/{period_id}", response_model=PostingPeriodResponse)
async def get_posting_period(period_id: int):
    try:
        async with pool.acquire() as connection:
            query = "SELECT * FROM posting_periods WHERE period_id = $1;"
            record = await connection.fetchrow(query, period_id)
            if not record:
                raise HTTPException(status_code=404, detail="Posting period not found")
            return dict(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching posting period: {str(e)}")

@api_router.post("/posting-periods", response_model=PostingPeriodResponse, status_code=status.HTTP_201_CREATED)
async def create_posting_period(period: PostingPeriodCreate):
    try:
        async with pool.acquire() as connection:
            # Validate date range
            if period.start_date >= period.end_date:
                raise HTTPException(status_code=400, detail="End date must be after start date")
            
            # Validate period month range
            if period.period_month and (period.period_month < 1 or period.period_month > 12):
                raise HTTPException(status_code=400, detail="Period month must be between 1 and 12")
            
            # Check for overlapping periods
            overlap_query = """
                SELECT period_code FROM posting_periods 
                WHERE (start_date, end_date) OVERLAPS ($1, $2)
                AND period_id != COALESCE($3, -1);
            """
            overlapping = await connection.fetchrow(overlap_query, period.start_date, period.end_date, None)
            if overlapping:
                raise HTTPException(status_code=400, detail="Period dates overlap with existing period")
            
            # Check for duplicate period code
            duplicate_query = "SELECT period_code FROM posting_periods WHERE period_code = $1;"
            duplicate = await connection.fetchrow(duplicate_query, period.period_code)
            if duplicate:
                raise HTTPException(status_code=400, detail="Period code already exists")
            
            # Insert the posting period
            insert_query = """
                INSERT INTO posting_periods (
                    period_code, period_name, start_date, end_date, fiscal_year, period_month,
                    period_status, allow_posting, allow_goods_receipt, allow_goods_issue, 
                    allow_invoice_verification, created_by, updated_by
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                ) RETURNING period_id;
            """
            
            inserted = await connection.fetchrow(
                insert_query,
                period.period_code,
                period.period_name,
                period.start_date,
                period.end_date,
                period.fiscal_year,
                period.period_month,
                period.period_status,
                period.allow_posting,
                period.allow_goods_receipt,
                period.allow_goods_issue,
                period.allow_invoice_verification,
                period.created_by,
                period.updated_by
            )
            
            # Fetch the complete record
            full_query = "SELECT * FROM posting_periods WHERE period_id = $1;"
            full_record = await connection.fetchrow(full_query, inserted['period_id'])
            return dict(full_record)
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating posting period: {str(e)}")

@api_router.put("/posting-periods/{period_id}", response_model=PostingPeriodResponse)
async def update_posting_period(period_id: int, period: PostingPeriodCreate):
    try:
        async with pool.acquire() as connection:
            # Check if period exists
            existing = await connection.fetchrow(
                "SELECT period_id FROM posting_periods WHERE period_id = $1;", 
                period_id
            )
            if not existing:
                raise HTTPException(status_code=404, detail="Posting period not found")
            
            # Validate date range
            if period.start_date >= period.end_date:
                raise HTTPException(status_code=400, detail="End date must be after start date")
            
            # Validate period month range
            if period.period_month and (period.period_month < 1 or period.period_month > 12):
                raise HTTPException(status_code=400, detail="Period month must be between 1 and 12")
            
            # Check for overlapping periods (excluding current period)
            overlap_query = """
                SELECT period_code FROM posting_periods 
                WHERE (start_date, end_date) OVERLAPS ($1, $2)
                AND period_id != $3;
            """
            overlapping = await connection.fetchrow(overlap_query, period.start_date, period.end_date, period_id)
            if overlapping:
                raise HTTPException(status_code=400, detail="Period dates overlap with existing period")
            
            # Check for duplicate period code (excluding current period)
            duplicate_query = """
                SELECT period_code FROM posting_periods 
                WHERE period_code = $1 AND period_id != $2;
            """
            duplicate = await connection.fetchrow(duplicate_query, period.period_code, period_id)
            if duplicate:
                raise HTTPException(status_code=400, detail="Period code already exists")
            
            # Update the posting period
            update_query = """
                UPDATE posting_periods SET
                    period_code = $1,
                    period_name = $2,
                    start_date = $3,
                    end_date = $4,
                    fiscal_year = $5,
                    period_month = $6,
                    period_status = $7,
                    allow_posting = $8,
                    allow_goods_receipt = $9,
                    allow_goods_issue = $10,
                    allow_invoice_verification = $11,
                    updated_by = $12,
                    updated_at = CURRENT_TIMESTAMP
                WHERE period_id = $13
                RETURNING period_id;
            """
            
            result = await connection.fetchrow(
                update_query,
                period.period_code,
                period.period_name,
                period.start_date,
                period.end_date,
                period.fiscal_year,
                period.period_month,
                period.period_status,
                period.allow_posting,
                period.allow_goods_receipt,
                period.allow_goods_issue,
                period.allow_invoice_verification,
                period.updated_by,
                period_id
            )
            
            # Fetch the updated record
            full_query = "SELECT * FROM posting_periods WHERE period_id = $1;"
            full_record = await connection.fetchrow(full_query, result['period_id'])
            return dict(full_record)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating posting period: {str(e)}")

@api_router.put("/posting-periods/{period_id}/status", response_model=PostingPeriodResponse)
async def update_posting_period_status(period_id: int, status_update: PostingPeriodStatusUpdate):
    try:
        async with pool.acquire() as connection:
            # Check if period exists
            existing = await connection.fetchrow(
                "SELECT period_id FROM posting_periods WHERE period_id = $1;", 
                period_id
            )
            if not existing:
                raise HTTPException(status_code=404, detail="Posting period not found")
            
            # Validate status
            if status_update.period_status not in ['Open', 'Closed', 'Future']:
                raise HTTPException(status_code=400, detail="Invalid status. Must be 'Open', 'Closed', or 'Future'")
            
            # Update the status
            update_query = """
                UPDATE posting_periods SET
                    period_status = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE period_id = $2
                RETURNING period_id;
            """
            
            result = await connection.fetchrow(
                update_query,
                status_update.period_status,
                period_id
            )
            
            # Fetch the updated record
            full_query = "SELECT * FROM posting_periods WHERE period_id = $1;"
            full_record = await connection.fetchrow(full_query, result['period_id'])
            return dict(full_record)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating posting period status: {str(e)}")

@api_router.delete("/posting-periods/{period_id}")
async def delete_posting_period(period_id: int):
    try:
        async with pool.acquire() as connection:
            # Check if period exists
            existing = await connection.fetchrow(
                "SELECT period_id FROM posting_periods WHERE period_id = $1;", 
                period_id
            )
            if not existing:
                raise HTTPException(status_code=404, detail="Posting period not found")
            
            # Check if period is being used (you might want to add this check later when you have transactions)
            # usage_check = await connection.fetchrow(
            #     "SELECT transaction_id FROM financial_transactions WHERE period_id = $1 LIMIT 1;", 
            #     period_id
            # )
            # if usage_check:
            #     raise HTTPException(status_code=400, detail="Cannot delete period with existing transactions")
            
            # Delete the period
            result = await connection.execute(
                "DELETE FROM posting_periods WHERE period_id = $1;", 
                period_id
            )
            
            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Posting period not found")
                
            return {"message": "Posting period deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting posting period: {str(e)}")

# Utility endpoint to get current active period
@api_router.get("/current-posting-period")
async def get_current_posting_period():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT * FROM posting_periods 
                WHERE period_status = 'Open' 
                AND CURRENT_DATE BETWEEN start_date AND end_date
                ORDER BY start_date DESC
                LIMIT 1;
            """
            record = await connection.fetchrow(query)
            if not record:
                raise HTTPException(status_code=404, detail="No active posting period found")
            return dict(record)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching current posting period: {str(e)}")

# Purchase Request Endpoints - Header-Row Structure
@api_router.get("/purchase-requests", response_model=List[PurReqHeaderResponse])
async def get_purchase_requests():
    try:
        async with pool.acquire() as connection:
            # Get headers
            headers_query = """
                SELECT 
                    h.req_id,
                    h.req_no,
                    h.post_per,
                    h.emp_code,
                    h.emp_name,
                    h.emp_dept,
                    h.post_dt,
                    h.valid_dt,
                    h.doc_dt,
                    h.req_status,
                    h.priority,
                    h.remarks,
                    h.created_by,
                    h.created_at,
                    h.updated_by,
                    h.updated_at,
                    COALESCE(SUM(r.req_qty), 0) as total_qty
                FROM pur_req_header h
                LEFT JOIN department_master dm ON h.emp_dept = dm.dept_id
                LEFT JOIN pur_req_row r ON h.req_id = r.req_id
                GROUP BY h.req_id, h.emp_dept
                ORDER BY h.req_no DESC;
            """
            headers = await connection.fetch(headers_query)
            
            # Get rows for each header
            result = []
            for header in headers:
                rows_query = """
                    SELECT 
                        r.req_row_id,
                        r.req_id,
                        r.line_no,
                        r.it_id,
                        r.it_code,
                        r.it_name,
                        r.it_details,
                        r.it_hsn,
                        r.need_date,
                        r.current_stock,
                        r.req_qty,
                        r.created_by,
                        r.created_at
                    FROM pur_req_row r
                    WHERE r.req_id = $1
                    ORDER BY r.line_no;
                """
                rows = await connection.fetch(rows_query, header['req_id'])
                
                header_dict = dict(header)
                header_dict['rows'] = [dict(row) for row in rows]
                result.append(header_dict)
            
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching purchase requests: {str(e)}")

@api_router.get("/purchase-requests/approved")
async def get_approved_purchase_requests():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    h.req_id, h.req_no, h.emp_code, h.emp_name, h.emp_dept,
                    h.post_dt, h.doc_dt, h.priority, h.remarks,
                    COUNT(r.req_row_id) as item_count,
                    SUM(r.req_qty) as total_qty
                FROM pur_req_header h
                JOIN pur_req_row r ON h.req_id = r.req_id
                WHERE h.req_status = 'Approved'
                GROUP BY h.req_id, h.req_no, h.emp_code, h.emp_name, h.emp_dept, h.post_dt, h.doc_dt, h.priority, h.remarks
                ORDER BY h.req_no DESC;
            """
            results = await connection.fetch(query)
            return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching approved purchase requests: {str(e)}")


@api_router.get("/purchase-requests/{req_id}", response_model=PurReqHeaderResponse)
async def get_purchase_request(req_id: int):
    try:
        async with pool.acquire() as connection:
            # Get header
            header_query = """
                SELECT 
                    h.req_id,
                    h.req_no,
                    h.post_per,
                    h.emp_code,
                    h.emp_name,
                    h.emp_dept,
                    h.post_dt,
                    h.valid_dt,
                    h.doc_dt,
                    h.req_status,
                    h.priority,
                    h.remarks,
                    h.created_by,
                    h.created_at,
                    h.updated_by,
                    h.updated_at,
                    COALESCE(SUM(r.req_qty), 0) as total_qty
                FROM pur_req_header h
                LEFT JOIN department_master dm ON h.emp_dept = dm.dept_id
                LEFT JOIN pur_req_row r ON h.req_id = r.req_id
                WHERE h.req_id = $1
                GROUP BY h.req_id, h.emp_dept;
            """
            header = await connection.fetchrow(header_query, req_id)
            if not header:
                raise HTTPException(status_code=404, detail="Purchase request not found")
            
            # Get rows
            rows_query = """
                SELECT * FROM pur_req_row 
                WHERE req_id = $1 
                ORDER BY line_no;
            """
            rows = await connection.fetch(rows_query, req_id)
            
            header_dict = dict(header)
            header_dict['rows'] = [dict(row) for row in rows]
            return header_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching purchase request: {str(e)}")

@api_router.post("/purchase-requests", response_model=PurReqHeaderResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_request(purchase_request: PurReqHeaderCreate):
    try:
        async with pool.acquire() as connection:
            # Validate at least one row
            if not purchase_request.rows:
                raise HTTPException(status_code=400, detail="Purchase request must have at least one item")
            
            # Validate line numbers are sequential and unique
            line_nos = [row.line_no for row in purchase_request.rows]
            if len(line_nos) != len(set(line_nos)):
                raise HTTPException(status_code=400, detail="Line numbers must be unique")
            if sorted(line_nos) != list(range(1, len(line_nos) + 1)):
                raise HTTPException(status_code=400, detail="Line numbers must be sequential starting from 1")
            
            # Validate employee exists
            employee = await connection.fetchrow(
                "SELECT emp_code, emp_name, dept_id FROM employee_master WHERE emp_code = $1;", 
                purchase_request.emp_code
            )
            if not employee:
                raise HTTPException(status_code=400, detail=f"Employee with code {purchase_request.emp_code} does not exist")
            
            # Validate posting period
            posting_period = await connection.fetchrow(
                "SELECT period_id FROM posting_periods WHERE $1 BETWEEN start_date AND end_date AND period_status = 'Open' AND allow_posting = true;",
                purchase_request.post_dt
            )
            if not posting_period:
                raise HTTPException(status_code=400, detail="No open posting period found for the given date")
            
            # Calculate validity date
            from datetime import timedelta
            valid_dt = purchase_request.post_dt + timedelta(days=30)
            
            # Insert header
            header_query = """
                INSERT INTO pur_req_header (
                    post_per, emp_code, emp_name, emp_dept, post_dt, valid_dt, doc_dt,
                    priority, req_status, remarks, created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING req_id;
            """
            
            header_id = await connection.fetchrow(
                header_query,
                int(posting_period['period_id']),
                purchase_request.emp_code,
                employee['emp_name'],
                employee['dept_id'],
                purchase_request.post_dt,
                valid_dt,
                purchase_request.doc_dt,
                purchase_request.priority,
                purchase_request.req_status,
                purchase_request.remarks,
                purchase_request.created_by,
                purchase_request.updated_by
            )
            
            req_id = header_id['req_id']
            
            # Insert rows
            for row in purchase_request.rows:
                # Validate item exists
                item = await connection.fetchrow(
                    "SELECT it_id, it_code, it_name, it_hsn, it_details FROM item_master WHERE it_id = $1;", 
                    row.it_id
                )
                if not item:
                    raise HTTPException(status_code=400, detail=f"Item with ID {row.it_id} does not exist")
                
                # Get current stock
                current_stock_query = "SELECT COALESCE(SUM(stock_qty), 0) as current_stock FROM stock_transactions WHERE item_id = $1;"
                current_stock_result = await connection.fetchrow(current_stock_query, row.it_id)
                current_stock = float(current_stock_result['current_stock']) if current_stock_result else 0
                
                # Insert row
                row_query = """
                    INSERT INTO pur_req_row (
                        req_id, line_no, it_id, it_code, it_name, it_details, it_hsn,
                        need_date, current_stock, req_qty, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
                """
                
                await connection.execute(
                    row_query,
                    req_id,
                    row.line_no,
                    row.it_id,
                    item['it_code'],
                    item['it_name'],
                    item['it_details'],
                    item['it_hsn'],
                    row.need_date,
                    current_stock,
                    row.req_qty,
                    row.created_by
                )
            
            # Return complete record
            return await get_purchase_request(req_id)
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating purchase request: {str(e)}")

@api_router.put("/purchase-requests/{req_id}", response_model=PurReqHeaderResponse)
async def update_purchase_request(req_id: int, purchase_request: PurReqHeaderCreate):
    try:
        async with pool.acquire() as connection:
            # Check if purchase request exists
            existing = await connection.fetchrow("SELECT req_id FROM pur_req_header WHERE req_id = $1;", req_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Purchase request not found")
            
            # Validate at least one row
            if not purchase_request.rows:
                raise HTTPException(status_code=400, detail="Purchase request must have at least one item")
            
            # Validate line numbers
            line_nos = [row.line_no for row in purchase_request.rows]
            if len(line_nos) != len(set(line_nos)):
                raise HTTPException(status_code=400, detail="Line numbers must be unique")
            if sorted(line_nos) != list(range(1, len(line_nos) + 1)):
                raise HTTPException(status_code=400, detail="Line numbers must be sequential starting from 1")
            
            # Validate employee
            employee = await connection.fetchrow(
                "SELECT emp_code, emp_name, dept_id FROM employee_master WHERE emp_code = $1;", 
                purchase_request.emp_code
            )
            if not employee:
                raise HTTPException(status_code=400, detail=f"Employee with code {purchase_request.emp_code} does not exist")
            
            # Validate posting period
            posting_period = await connection.fetchrow(
                "SELECT period_id FROM posting_periods WHERE $1 BETWEEN start_date AND end_date AND period_status = 'Open' AND allow_posting = true;",
                purchase_request.post_dt
            )
            if not posting_period:
                raise HTTPException(status_code=400, detail="No open posting period found for the given date")
            
            # Calculate validity date
            from datetime import timedelta
            valid_dt = purchase_request.post_dt + timedelta(days=30)
            
            # Update header
            header_query = """
                UPDATE pur_req_header SET
                    post_per = $1, emp_code = $2, emp_name = $3, emp_dept = $4,
                    post_dt = $5, valid_dt = $6, doc_dt = $7, priority = $8,
                    req_status = $9, remarks = $10, updated_by = $11, updated_at = CURRENT_TIMESTAMP
                WHERE req_id = $12;
            """
            
            await connection.execute(
                header_query,
                int(posting_period['period_id']),
                purchase_request.emp_code,
                employee['emp_name'],
                employee['dept_id'],
                purchase_request.post_dt,
                valid_dt,
                purchase_request.doc_dt,
                purchase_request.priority,
                purchase_request.req_status,
                purchase_request.remarks,
                purchase_request.updated_by,
                req_id
            )
            
            # Delete existing rows and insert new ones
            await connection.execute("DELETE FROM pur_req_row WHERE req_id = $1;", req_id)
            
            # Insert updated rows
            for row in purchase_request.rows:
                item = await connection.fetchrow(
                    "SELECT it_id, it_code, it_name, it_hsn, it_details FROM item_master WHERE it_id = $1;", 
                    row.it_id
                )
                if not item:
                    raise HTTPException(status_code=400, detail=f"Item with ID {row.it_id} does not exist")
                
                current_stock_query = "SELECT COALESCE(SUM(stock_qty), 0) as current_stock FROM stock_transactions WHERE item_id = $1;"
                current_stock_result = await connection.fetchrow(current_stock_query, row.it_id)
                current_stock = float(current_stock_result['current_stock']) if current_stock_result else 0
                
                row_query = """
                    INSERT INTO pur_req_row (
                        req_id, line_no, it_id, it_code, it_name, it_details, it_hsn,
                        need_date, current_stock, req_qty, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
                """
                
                await connection.execute(
                    row_query,
                    req_id,
                    row.line_no,
                    row.it_id,
                    item['it_code'],
                    item['it_name'],
                    item['it_details'],
                    item['it_hsn'],
                    row.need_date,
                    current_stock,
                    row.req_qty,
                    row.created_by
                )
            
            return await get_purchase_request(req_id)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating purchase request: {str(e)}")

@api_router.put("/purchase-requests/{req_id}/status", response_model=PurReqHeaderResponse)
async def update_purchase_request_status(req_id: int, status_update: PurReqStatusUpdate):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT req_id FROM pur_req_header WHERE req_id = $1;", req_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Purchase request not found")
            
            if status_update.req_status not in ['Pending', 'Approved', 'Rejected', 'Converted to PO']:
                raise HTTPException(status_code=400, detail="Invalid status")
            
            await connection.execute(
                "UPDATE pur_req_header SET req_status = $1, updated_at = CURRENT_TIMESTAMP WHERE req_id = $2;",
                status_update.req_status, req_id
            )
            
            return await get_purchase_request(req_id)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating purchase request status: {str(e)}")

@api_router.delete("/purchase-requests/{req_id}")
async def delete_purchase_request(req_id: int):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT req_id FROM pur_req_header WHERE req_id = $1;", req_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Purchase request not found")
            
            # Rows will be automatically deleted due to CASCADE
            await connection.execute("DELETE FROM pur_req_header WHERE req_id = $1;", req_id)
            
            return {"message": "Purchase request deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting purchase request: {str(e)}")


# Purchase Order Endpoints
@api_router.get("/purchase-orders", response_model=List[PurOrdHeaderResponse])
async def get_purchase_orders():
    try:
        async with pool.acquire() as connection:
            # Get headers
            headers_query = """
                SELECT 
                    po_id, po_no, post_per, post_dt, doc_dt,
                    bpcode, bpname, emp_code, emp_name, dept_id,
                    subtotal, discount_amt, tax_amt, total_amt,
                    po_status, created_by, created_at, updated_by, updated_at
                FROM pur_ord_header
                ORDER BY po_no DESC;
            """
            headers = await connection.fetch(headers_query)
            
            # Get rows for each header
            result = []
            for header in headers:
                rows_query = """
                    SELECT 
                        po_row_id, po_id, line_no, it_id, it_code, it_name, 
                        it_details, hsn_code, uom_id, req_qty, need_date,
                        unit_price, discount_percent, discount_amt, tax_code,
                        tax_rate, tax_amt, line_total, whs_id,
                        pr_req_id, pr_line_no, pr_no, created_by, created_at
                    FROM pur_ord_row
                    WHERE po_id = $1
                    ORDER BY line_no;
                """
                rows = await connection.fetch(rows_query, header['po_id'])
                
                header_dict = dict(header)
                header_dict['rows'] = [dict(row) for row in rows]
                result.append(header_dict)
            
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching purchase orders: {str(e)}")

@api_router.get("/purchase-orders/{po_id}", response_model=PurOrdHeaderResponse)
async def get_purchase_order(po_id: int):
    try:
        async with pool.acquire() as connection:
            # Get header
            header_query = """
                SELECT * FROM pur_ord_header WHERE po_id = $1;
            """
            header = await connection.fetchrow(header_query, po_id)
            if not header:
                raise HTTPException(status_code=404, detail="Purchase order not found")
            
            # Get rows
            rows_query = """
                SELECT * FROM pur_ord_row 
                WHERE po_id = $1 
                ORDER BY line_no;
            """
            rows = await connection.fetch(rows_query, po_id)
            
            header_dict = dict(header)
            header_dict['rows'] = [dict(row) for row in rows]
            return header_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching purchase order: {str(e)}")

@api_router.post("/purchase-orders/convert-from-pr", response_model=PurOrdHeaderResponse, status_code=status.HTTP_201_CREATED)
async def create_po_from_pr(conversion: PRToPOConversion):
    try:
        async with pool.acquire() as connection:
            # Validate vendor exists and is actually a vendor (bptype_id = 2)
            vendor_check = await connection.fetchrow("""
                SELECT bpcode, bpname FROM business_master 
                WHERE bpcode = $1 AND bptype_id = 2;
            """, conversion.bpcode)
            
            if not vendor_check:
                raise HTTPException(status_code=400, detail="Invalid vendor or vendor not found")
            
            # Validate posting period
            posting_period = await connection.fetchrow(
                "SELECT period_id FROM posting_periods WHERE $1 BETWEEN start_date AND end_date AND period_status = 'Open' AND allow_posting = true;",
                conversion.post_dt
            )
            if not posting_period:
                raise HTTPException(status_code=400, detail="No open posting period found for the given date")
            
            # Get all PRs to convert
            prs_data = []
            for req_id in conversion.req_ids:
                pr_query = """
                    SELECT h.req_id, h.req_no, h.emp_code, h.emp_name, h.emp_dept as dept_id,
                           r.req_row_id, r.line_no, r.it_id, r.it_code, r.it_name, 
                           r.it_details, r.it_hsn as hsn_code, r.need_date, r.req_qty
                    FROM pur_req_header h
                    JOIN pur_req_row r ON h.req_id = r.req_id
                    WHERE h.req_id = $1 AND h.req_status = 'Approved'
                """
                pr_rows = await connection.fetch(pr_query, req_id)
                
                if not pr_rows:
                    raise HTTPException(status_code=400, detail=f"PR {req_id} not found or not approved")
                
                # Get first row for header info
                first_row = pr_rows[0]
                prs_data.append({
                    'req_id': req_id,
                    'req_no': first_row['req_no'],
                    'emp_code': first_row['emp_code'],
                    'emp_name': first_row['emp_name'],
                    'dept_id': first_row['dept_id'],
                    'rows': pr_rows
                })
            
            # Use first PR's employee details for the PO
            first_pr = prs_data[0]
            
            # Insert PO header (po_no will be auto-generated by trigger)
            header_query = """
                INSERT INTO pur_ord_header (
                    post_per, post_dt, doc_dt, bpcode, bpname,
                    emp_code, emp_name, dept_id, created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING po_id;
            """
            
            header_id = await connection.fetchrow(
                header_query,
                int(posting_period['period_id']),
                conversion.post_dt,
                conversion.doc_dt,
                conversion.bpcode,
                vendor_check['bpname'],
                first_pr['emp_code'],
                first_pr['emp_name'],
                first_pr['dept_id'],
                conversion.created_by,
                conversion.created_by
            )
            
            po_id = header_id['po_id']
            
            # Insert PO rows from all PRs
            line_no = 1
            subtotal = 0
            total_discount = 0
            total_tax = 0
            
            for pr in prs_data:
                for pr_row in pr['rows']:
                    # Get UOM from item master (default to first if multiple)
                    uom_data = await connection.fetchrow(
                        "SELECT uom_id FROM uom LIMIT 1;"
                    )
                    uom_id = uom_data['uom_id'] if uom_data else None
                    
                    # Get warehouse (default to first)
                    whs_data = await connection.fetchrow(
                        "SELECT whs_id FROM whs LIMIT 1;"
                    )
                    whs_id = whs_data['whs_id'] if whs_data else None
                    
                    # Calculate line values (defaults - will be updated by user)
                    unit_price = 0
                    discount_percent = 0
                    discount_amt = 0
                    tax_rate = 0
                    tax_amt = 0
                    line_total = 0
                    
                    row_query = """
                        INSERT INTO pur_ord_row (
                            po_id, line_no, it_id, it_code, it_name, it_details, hsn_code,
                            uom_id, req_qty, need_date, unit_price, discount_percent,
                            discount_amt, tax_code, tax_rate, tax_amt, line_total,
                            whs_id, pr_req_id, pr_line_no, pr_no, created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22);
                    """
                    
                    await connection.execute(
                        row_query,
                        po_id,
                        line_no,
                        pr_row['it_id'],
                        pr_row['it_code'],
                        pr_row['it_name'],
                        pr_row['it_details'],
                        pr_row['hsn_code'],
                        uom_id,
                        pr_row['req_qty'],
                        pr_row['need_date'],
                        unit_price,
                        discount_percent,
                        discount_amt,
                        None,  # tax_code
                        tax_rate,
                        tax_amt,
                        line_total,
                        whs_id,
                        pr_row['req_id'],
                        pr_row['line_no'],
                        pr['req_no'],
                        conversion.created_by
                    )
                    
                    line_no += 1
            
            # Update PR status to 'Converted to PO'
            for req_id in conversion.req_ids:
                await connection.execute(
                    "UPDATE pur_req_header SET req_status = 'Converted to PO' WHERE req_id = $1;",
                    req_id
                )
            
            return await get_purchase_order(po_id)
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating purchase order from PR: {str(e)}")

@api_router.post("/purchase-orders", response_model=PurOrdHeaderResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(purchase_order: PurOrdHeaderCreate):
    try:
        async with pool.acquire() as connection:
            # Validate vendor exists and is actually a vendor (bptype_id = 2)
            vendor_check = await connection.fetchrow("""
                SELECT bpcode, bpname FROM business_master 
                WHERE bpcode = $1 AND bptype_id = 2;
            """, purchase_order.bpcode)
            
            if not vendor_check:
                raise HTTPException(status_code=400, detail="Invalid vendor or vendor not found")
            
            # Validate posting period
            posting_period = await connection.fetchrow(
                "SELECT period_id FROM posting_periods WHERE $1 BETWEEN start_date AND end_date AND period_status = 'Open' AND allow_posting = true;",
                purchase_order.post_dt
            )
            if not posting_period:
                raise HTTPException(status_code=400, detail="No open posting period found for the given date")
            
            # Validate at least one row
            if not purchase_order.rows:
                raise HTTPException(status_code=400, detail="Purchase order must have at least one item")
            
            # Validate line numbers
            line_nos = [row.line_no for row in purchase_order.rows]
            if len(line_nos) != len(set(line_nos)):
                raise HTTPException(status_code=400, detail="Line numbers must be unique")
            if sorted(line_nos) != list(range(1, len(line_nos) + 1)):
                raise HTTPException(status_code=400, detail="Line numbers must be sequential starting from 1")
            
            # Calculate totals
            subtotal = sum(row.line_total for row in purchase_order.rows)
            discount_amt = sum(row.discount_amt for row in purchase_order.rows)
            tax_amt = sum(row.tax_amt for row in purchase_order.rows)
            total_amt = subtotal - discount_amt + tax_amt
            
            # Insert header (po_no will be auto-generated by trigger)
            header_query = """
                INSERT INTO pur_ord_header (
                    post_per, post_dt, doc_dt, bpcode, bpname,
                    emp_code, emp_name, dept_id, subtotal, discount_amt,
                    tax_amt, total_amt, po_status, created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING po_id;
            """
            
            header_id = await connection.fetchrow(
                header_query,
                int(posting_period['period_id']),
                purchase_order.post_dt,
                purchase_order.doc_dt,
                purchase_order.bpcode,
                vendor_check['bpname'],
                purchase_order.emp_code,
                purchase_order.emp_name,
                purchase_order.dept_id,
                subtotal,
                discount_amt,
                tax_amt,
                total_amt,
                purchase_order.po_status,
                purchase_order.created_by,
                purchase_order.updated_by
            )
            
            po_id = header_id['po_id']
            
            # Insert rows
            for row in purchase_order.rows:
                # Validate item exists
                item = await connection.fetchrow(
                    "SELECT it_id, it_code, it_name FROM item_master WHERE it_id = $1;", 
                    row.it_id
                )
                if not item:
                    raise HTTPException(status_code=400, detail=f"Item with ID {row.it_id} does not exist")
                
                # Validate UOM if provided
                if row.uom_id:
                    uom_exists = await connection.fetchrow(
                        "SELECT uom_id FROM uom WHERE uom_id = $1;",
                        row.uom_id
                    )
                    if not uom_exists:
                        raise HTTPException(status_code=400, detail=f"UOM with ID {row.uom_id} does not exist")
                
                # Validate warehouse if provided
                if row.whs_id:
                    whs_exists = await connection.fetchrow(
                        "SELECT whs_id FROM whs WHERE whs_id = $1;",
                        row.whs_id
                    )
                    if not whs_exists:
                        raise HTTPException(status_code=400, detail=f"Warehouse with ID {row.whs_id} does not exist")
                
                # Validate tax code if provided
                if row.tax_code:
                    tax_exists = await connection.fetchrow(
                        "SELECT tax_code FROM tax_master WHERE tax_code = $1 AND is_active = true;",
                        row.tax_code
                    )
                    if not tax_exists:
                        raise HTTPException(status_code=400, detail=f"Tax code {row.tax_code} does not exist or is not active")
                
                row_query = """
                    INSERT INTO pur_ord_row (
                        po_id, line_no, it_id, it_code, it_name, it_details, hsn_code,
                        uom_id, req_qty, need_date, unit_price, discount_percent,
                        discount_amt, tax_code, tax_rate, tax_amt, line_total,
                        whs_id, pr_req_id, pr_line_no, pr_no, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22);
                """
                
                await connection.execute(
                    row_query,
                    po_id,
                    row.line_no,
                    row.it_id,
                    row.it_code,
                    row.it_name,
                    row.it_details,
                    row.hsn_code,
                    row.uom_id,
                    row.req_qty,
                    row.need_date,
                    row.unit_price,
                    row.discount_percent,
                    row.discount_amt,
                    row.tax_code,
                    row.tax_rate,
                    row.tax_amt,
                    row.line_total,
                    row.whs_id,
                    row.pr_req_id,
                    row.pr_line_no,
                    row.pr_no,
                    row.created_by
                )
            
            return await get_purchase_order(po_id)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating purchase order: {str(e)}")

@api_router.put("/purchase-orders/{po_id}", response_model=PurOrdHeaderResponse)
async def update_purchase_order(po_id: int, purchase_order: PurOrdHeaderCreate):
    try:
        async with pool.acquire() as connection:
            # Check if purchase order exists
            existing = await connection.fetchrow("SELECT po_id, po_status FROM pur_ord_header WHERE po_id = $1;", po_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Purchase order not found")
            
            # Prevent updates if PO is closed
            if existing['po_status'] == 'Closed':
                raise HTTPException(status_code=400, detail="Cannot update a closed purchase order")
            
            # Validate vendor
            vendor_check = await connection.fetchrow("""
                SELECT bpcode, bpname FROM business_master 
                WHERE bpcode = $1 AND bptype_id = 2;
            """, purchase_order.bpcode)
            
            if not vendor_check:
                raise HTTPException(status_code=400, detail="Invalid vendor or vendor not found")
            
            # Validate posting period
            posting_period = await connection.fetchrow(
                "SELECT period_id FROM posting_periods WHERE $1 BETWEEN start_date AND end_date AND period_status = 'Open' AND allow_posting = true;",
                purchase_order.post_dt
            )
            if not posting_period:
                raise HTTPException(status_code=400, detail="No open posting period found for the given date")
            
            # Validate at least one row
            if not purchase_order.rows:
                raise HTTPException(status_code=400, detail="Purchase order must have at least one item")
            
            # Validate line numbers
            line_nos = [row.line_no for row in purchase_order.rows]
            if len(line_nos) != len(set(line_nos)):
                raise HTTPException(status_code=400, detail="Line numbers must be unique")
            if sorted(line_nos) != list(range(1, len(line_nos) + 1)):
                raise HTTPException(status_code=400, detail="Line numbers must be sequential starting from 1")
            
            # Calculate totals
            subtotal = sum(row.line_total for row in purchase_order.rows)
            discount_amt = sum(row.discount_amt for row in purchase_order.rows)
            tax_amt = sum(row.tax_amt for row in purchase_order.rows)
            total_amt = subtotal - discount_amt + tax_amt
            
            # Update header
            header_query = """
                UPDATE pur_ord_header SET
                    post_per = $1, post_dt = $2, doc_dt = $3, bpcode = $4, bpname = $5,
                    emp_code = $6, emp_name = $7, dept_id = $8, subtotal = $9, discount_amt = $10,
                    tax_amt = $11, total_amt = $12, po_status = $13, updated_by = $14, updated_at = CURRENT_TIMESTAMP
                WHERE po_id = $15;
            """
            
            await connection.execute(
                header_query,
                int(posting_period['period_id']),
                purchase_order.post_dt,
                purchase_order.doc_dt,
                purchase_order.bpcode,
                vendor_check['bpname'],
                purchase_order.emp_code,
                purchase_order.emp_name,
                purchase_order.dept_id,
                subtotal,
                discount_amt,
                tax_amt,
                total_amt,
                purchase_order.po_status,
                purchase_order.updated_by,
                po_id
            )
            
            # Delete existing rows and insert new ones
            await connection.execute("DELETE FROM pur_ord_row WHERE po_id = $1;", po_id)
            
            # Insert updated rows
            for row in purchase_order.rows:
                # Validate item exists
                item = await connection.fetchrow(
                    "SELECT it_id, it_code, it_name FROM item_master WHERE it_id = $1;", 
                    row.it_id
                )
                if not item:
                    raise HTTPException(status_code=400, detail=f"Item with ID {row.it_id} does not exist")
                
                # Validate UOM if provided
                if row.uom_id:
                    uom_exists = await connection.fetchrow(
                        "SELECT uom_id FROM uom WHERE uom_id = $1;",
                        row.uom_id
                    )
                    if not uom_exists:
                        raise HTTPException(status_code=400, detail=f"UOM with ID {row.uom_id} does not exist")
                
                # Validate warehouse if provided
                if row.whs_id:
                    whs_exists = await connection.fetchrow(
                        "SELECT whs_id FROM whs WHERE whs_id = $1;",
                        row.whs_id
                    )
                    if not whs_exists:
                        raise HTTPException(status_code=400, detail=f"Warehouse with ID {row.whs_id} does not exist")
                
                # Validate tax code if provided
                if row.tax_code:
                    tax_exists = await connection.fetchrow(
                        "SELECT tax_code FROM tax_master WHERE tax_code = $1 AND is_active = true;",
                        row.tax_code
                    )
                    if not tax_exists:
                        raise HTTPException(status_code=400, detail=f"Tax code {row.tax_code} does not exist or is not active")
                
                row_query = """
                    INSERT INTO pur_ord_row (
                        po_id, line_no, it_id, it_code, it_name, it_details, hsn_code,
                        uom_id, req_qty, need_date, unit_price, discount_percent,
                        discount_amt, tax_code, tax_rate, tax_amt, line_total,
                        whs_id, pr_req_id, pr_line_no, pr_no, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22);
                """
                
                await connection.execute(
                    row_query,
                    po_id,
                    row.line_no,
                    row.it_id,
                    row.it_code,
                    row.it_name,
                    row.it_details,
                    row.hsn_code,
                    row.uom_id,
                    row.req_qty,
                    row.need_date,
                    row.unit_price,
                    row.discount_percent,
                    row.discount_amt,
                    row.tax_code,
                    row.tax_rate,
                    row.tax_amt,
                    row.line_total,
                    row.whs_id,
                    row.pr_req_id,
                    row.pr_line_no,
                    row.pr_no,
                    row.created_by
                )
            
            return await get_purchase_order(po_id)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating purchase order: {str(e)}")

@api_router.put("/purchase-orders/{po_id}/status", response_model=PurOrdHeaderResponse)
async def update_purchase_order_status(po_id: int, status_update: PurOrdStatusUpdate):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT po_id, po_status FROM pur_ord_header WHERE po_id = $1;", po_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Purchase order not found")
            
            if status_update.po_status not in ['Open', 'Closed']:
                raise HTTPException(status_code=400, detail="Invalid status. Must be 'Open' or 'Closed'")
            
            # Additional validation for closing PO
            if status_update.po_status == 'Closed':
                # Check if there are any GRPOs for this PO (you can add this later)
                pass
            
            await connection.execute(
                "UPDATE pur_ord_header SET po_status = $1, updated_at = CURRENT_TIMESTAMP WHERE po_id = $2;",
                status_update.po_status, po_id
            )
            
            return await get_purchase_order(po_id)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating purchase order status: {str(e)}")

@api_router.delete("/purchase-orders/{po_id}")
async def delete_purchase_order(po_id: int):
    try:
        async with pool.acquire() as connection:
            existing = await connection.fetchrow("SELECT po_id, po_status FROM pur_ord_header WHERE po_id = $1;", po_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Purchase order not found")
            
            # Prevent deletion if PO is closed
            if existing['po_status'] == 'Closed':
                raise HTTPException(status_code=400, detail="Cannot delete a closed purchase order")
            
            # Check if there are any GRPOs linked to this PO (add this check later)
            # grpo_check = await connection.fetchrow("SELECT grpo_id FROM grpo_header WHERE po_id = $1;", po_id)
            # if grpo_check:
            #     raise HTTPException(status_code=400, detail="Cannot delete purchase order with existing GRPOs")
            
            # Rows will be automatically deleted due to CASCADE
            await connection.execute("DELETE FROM pur_ord_header WHERE po_id = $1;", po_id)
            
            return {"message": "Purchase order deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting purchase order: {str(e)}")

# Additional endpoint to get approved PRs for conversion
@api_router.get("/purchase-requests/approved")
async def get_approved_purchase_requests():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    h.req_id, h.req_no, h.emp_code, h.emp_name, h.emp_dept,
                    h.post_dt, h.doc_dt, h.priority, h.remarks,
                    COUNT(r.req_row_id) as item_count,
                    SUM(r.req_qty) as total_qty
                FROM pur_req_header h
                JOIN pur_req_row r ON h.req_id = r.req_id
                WHERE h.req_status = 'Approved'
                GROUP BY h.req_id, h.req_no, h.emp_code, h.emp_name, h.emp_dept, h.post_dt, h.doc_dt, h.priority, h.remarks
                ORDER BY h.req_no DESC;
            """
            results = await connection.fetch(query)
            return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching approved purchase requests: {str(e)}")

# Endpoint to get vendors
@api_router.get("/vendors")
async def get_vendors():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT bpcode as bpcode, bpname, paddressline1, paddressline2, paddressline3, paddressline4, paddressline5, pcity, pstate
                FROM business_master 
                WHERE bptype_id = 2  -- Vendors only
                ORDER BY bpname;
            """
            results = await connection.fetch(query)
            return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching vendors: {str(e)}")

# Endpoint to get tax codes
@api_router.get("/tax-codes")
async def get_tax_codes():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT tax_id, tax_code, tax_name, tax_rate
                FROM tax_master 
                WHERE is_active = true
                ORDER BY tax_rate;
            """
            results = await connection.fetch(query)
            return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tax codes: {str(e)}")

# Endpoint to get warehouses
@api_router.get("/warehouses")
async def get_warehouses():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT whs_id, whs_name
                FROM whs 
                ORDER BY whs_name;
            """
            results = await connection.fetch(query)
            return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching warehouses: {str(e)}")

# Endpoint to get UOMs
@api_router.get("/uoms")
async def get_uoms():
    try:
        async with pool.acquire() as connection:
            query = """
                SELECT uom_id, uom_code, uom_name
                FROM uom 
                ORDER BY uom_name;
            """
            results = await connection.fetch(query)
            return [dict(row) for row in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching UOMs: {str(e)}")




# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000", "null"],
    #allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router)

