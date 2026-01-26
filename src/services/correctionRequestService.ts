import api from "./api";

export type CorrectionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE";

const correctionRequestService = {
    // 고용주 - 승인 대기중인 모든 요청 조회 (통합)
	getPendingApprovals: async (workplaceId: number | string, filter: CorrectionFilter = "ALL"): Promise<any> => {
		// 백엔드는 'type' 파라미터를 기대함 (CREATE, UPDATE, DELETE)
        // filter가 "ALL"이면 파라미터를 보내지 않음 (전체 조회)
        const params = filter === "ALL" ? {} : { type: filter };
		return await api.get(`/employer/workplaces/${workplaceId}/pending-approvals`, { params });
	},

    // 고용주 - 정정 요청 목록 조회
	getEmployerRequests: async (params?: Record<string, any>): Promise<any> => {
		return await api.get("/employer/correction-requests", { params });
	},

    // 고용주 - 정정 요청 상세 조회
	getEmployerRequest: async (id: number | string): Promise<any> => {
		return await api.get(`/employer/correction-requests/${id}`);
	},

    // 고용주 - 정정 요청 승인
	approveRequest: async (id: number | string): Promise<any> => {
		return await api.put(`/employer/correction-requests/${id}/approve`);
	},

    // 고용주 - 정정 요청 거절
	rejectRequest: async (id: number | string): Promise<any> => {
		return await api.put(`/employer/correction-requests/${id}/reject`);
	},

    // 근로자 - 정정 요청 생성
	createRequest: async (data: any): Promise<any> => {
		return await api.post("/worker/correction-requests", data);
	},

    // 근로자 - 내 정정 요청 목록 조회   
	getWorkerRequests: async (params?: Record<string, any>): Promise<any> => {
		return await api.get("/worker/correction-requests", { params });
	},

    // 근로자 - 내 정정 요청 상세 조회
	getWorkerRequest: async (id: number | string): Promise<any> => {
		return await api.get(`/worker/correction-requests/${id}`);
	},

    // 근로자 - 정정 요청 취소
	cancelRequest: async (id: number | string): Promise<any> => {
		return await api.delete(`/worker/correction-requests/${id}`);
	},
};

export default correctionRequestService;
