import api from "./api";

export interface WorkplacePayload {
	businessNumber: string;
	companyName: string;
	address: string;
	isLessThanFiveEmployees?: boolean;
}

const workplaceService = {
    // 근무지 목록 조회
	getWorkplaces: async (): Promise<any> => {
		return await api.get("/employer/workplaces");
	},

    // 근무지 상세 조회
	getWorkplace: async (id: number | string): Promise<any> => {
		return await api.get(`/employer/workplaces/${id}`);
	},

    // 근무지 생성
	createWorkplace: async (data: WorkplacePayload): Promise<any> => {
		return await api.post("/employer/workplaces", {
			businessNumber: data.businessNumber,
			businessName: data.companyName,
			name: data.companyName,
			address: data.address,
			isLessThanFiveEmployees: data.isLessThanFiveEmployees ?? false,
		});
	},

    // 근무지 수정
	updateWorkplace: async (id: number | string, data: WorkplacePayload): Promise<any> => {
		return await api.put(`/employer/workplaces/${id}`, {
			businessNumber: data.businessNumber,
			businessName: data.companyName,
			name: data.companyName,
			address: data.address,
			isLessThanFiveEmployees: data.isLessThanFiveEmployees ?? false,
		});
	},

    // 근무지 삭제
	deleteWorkplace: async (id: number | string): Promise<any> => {
		return await api.delete(`/employer/workplaces/${id}`);
	},
};

export default workplaceService;
