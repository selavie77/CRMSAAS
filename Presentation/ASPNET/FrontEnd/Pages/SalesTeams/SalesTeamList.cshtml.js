﻿const App = {
    setup() {
        const state = Vue.reactive({
            mainData: [],
            deleteMode: false,
            mainTitle: null,
            id: '',
            name: '',
            description: '',
            errors: {
                name: ''
            },
            isSubmitting: false,
        });

        const mainGridRef = Vue.ref(null);
        const mainModalRef = Vue.ref(null);
        const nameRef = Vue.ref(null);

        const services = {
            getMainData: async () => {
                try {
                    const response = await AxiosManager.get('/SalesTeam/GetSalesTeamList', {});
                    return response;
                } catch (error) {
                    throw error;
                }
            },
            createMainData: async (name, description, createdById) => {
                try {
                    const response = await AxiosManager.post('/SalesTeam/CreateSalesTeam', {
                        name, description, createdById
                    });
                    return response;
                } catch (error) {
                    throw error;
                }
            },
            updateMainData: async (id, name, description, updatedById) => {
                try {
                    const response = await AxiosManager.post('/SalesTeam/UpdateSalesTeam', {
                        id, name, description, updatedById
                    });
                    return response;
                } catch (error) {
                    throw error;
                }
            },
            deleteMainData: async (id, deletedById) => {
                try {
                    const response = await AxiosManager.post('/SalesTeam/DeleteSalesTeam', {
                        id, deletedById
                    });
                    return response;
                } catch (error) {
                    throw error;
                }
            },
        };

        const methods = {
            populateMainData: async () => {
                const response = await services.getMainData();
                const formattedData = response?.data?.content?.data.map(item => ({
                    ...item,
                    createdAtUtc: new Date(item.createdAtUtc)
                }));
                state.mainData = formattedData;
            },
            onMainModalHidden: () => {
                state.errors.name = '';
            }
        };

        const mainGrid = {
            obj: null,
            create: async (dataSource) => {
                mainGrid.obj = new ej.grids.Grid({
                    height: getDashminGridHeight(),
                    dataSource: dataSource,
                    allowFiltering: true,
                    allowSorting: true,
                    allowSelection: true,
                    allowGrouping: true,
                    allowTextWrap: true,
                    allowResizing: true,
                    allowPaging: true,
                    allowExcelExport: true,
                    filterSettings: { type: 'CheckBox' },
                    sortSettings: { columns: [{ field: 'createdAtUtc', direction: 'Descending' }] },
                    pageSettings: { currentPage: 1, pageSize: 50, pageSizes: ["10", "20", "50", "100", "200", "All"] },
                    selectionSettings: { persistSelection: true, type: 'Single' },
                    autoFit: true,
                    showColumnMenu: true,
                    gridLines: 'Horizontal',
                    columns: [
                        { type: 'checkbox', width: 60 },
                        {
                            field: 'id', isPrimaryKey: true, headerText: 'Id', visible: false
                        },
                        { field: 'name', headerText: 'Name', width: 200, minWidth: 200 },
                        { field: 'description', headerText: 'Description', width: 400, minWidth: 400 },
                        { field: 'createdAtUtc', headerText: 'Created At UTC', width: 150, format: 'yyyy-MM-dd HH:mm' }
                    ],
                    toolbar: [
                        'ExcelExport', 'Search',
                        { type: 'Separator' },
                        { text: 'Add', tooltipText: 'Add', prefixIcon: 'e-add', id: 'AddCustom' },
                        { text: 'Edit', tooltipText: 'Edit', prefixIcon: 'e-edit', id: 'EditCustom' },
                        { text: 'Delete', tooltipText: 'Delete', prefixIcon: 'e-delete', id: 'DeleteCustom' },
                        { type: 'Separator' },
                    ],
                    beforeDataBound: () => { },
                    dataBound: function () {
                        mainGrid.obj.toolbarModule.enableItems(['EditCustom', 'DeleteCustom'], false);
                        mainGrid.obj.autoFitColumns(['name', 'description', 'createdAtUtc']);
                    },
                    excelExportComplete: () => { },
                    rowSelected: () => {
                        if (mainGrid.obj.getSelectedRecords().length === 1) {
                            mainGrid.obj.toolbarModule.enableItems(['EditCustom', 'DeleteCustom'], true);
                        } else {
                            mainGrid.obj.toolbarModule.enableItems(['EditCustom', 'DeleteCustom'], false);
                        }
                    },
                    rowDeselected: () => {
                        if (mainGrid.obj.getSelectedRecords().length === 1) {
                            mainGrid.obj.toolbarModule.enableItems(['EditCustom', 'DeleteCustom'], true);
                        } else {
                            mainGrid.obj.toolbarModule.enableItems(['EditCustom', 'DeleteCustom'], false);
                        }
                    },
                    rowSelecting: () => {
                        if (mainGrid.obj.getSelectedRecords().length) {
                            mainGrid.obj.clearSelection();
                        }
                    },
                    toolbarClick: (args) => {
                        if (args.item.id === 'MainGrid_excelexport') {
                            mainGrid.obj.excelExport();
                        }

                        if (args.item.id === 'AddCustom') {
                            state.deleteMode = false;
                            state.mainTitle = 'Add Sales Team';
                            state.id = '';
                            state.name = '';
                            state.description = '';
                            mainModal.obj.show();
                        }

                        if (args.item.id === 'EditCustom') {
                            state.deleteMode = false;
                            if (mainGrid.obj.getSelectedRecords().length) {
                                const selectedRecord = mainGrid.obj.getSelectedRecords()[0];
                                state.mainTitle = 'Edit Sales Team';
                                state.id = selectedRecord.id ?? '';
                                state.name = selectedRecord.name ?? '';
                                state.description = selectedRecord.description ?? '';
                                mainModal.obj.show();
                            }
                        }

                        if (args.item.id === 'DeleteCustom') {
                            state.deleteMode = true;
                            if (mainGrid.obj.getSelectedRecords().length) {
                                const selectedRecord = mainGrid.obj.getSelectedRecords()[0];
                                state.mainTitle = 'Delete Sales Team?';
                                state.id = selectedRecord.id ?? '';
                                state.name = selectedRecord.name ?? '';
                                state.description = selectedRecord.description ?? '';
                                mainModal.obj.show();
                            }
                        }
                    }
                });

                mainGrid.obj.appendTo(mainGridRef.value);
            },
            refresh: () => {
                mainGrid.obj.setProperties({ dataSource: state.mainData });
            }
        };

        const mainModal = {
            obj: null,
            create: () => {
                mainModal.obj = new bootstrap.Modal(mainModalRef.value, {
                    backdrop: 'static',
                    keyboard: false
                });
            }
        };

        const nameText = {
            obj: null,
            create: () => {
                nameText.obj = new ej.inputs.TextBox({
                    placeholder: 'Enter Name',
                });
                nameText.obj.appendTo(nameRef.value);
            },
            refresh: () => {
                if (nameText.obj) {
                    nameText.obj.value = state.name;
                }
            }
        };

        const validateForm = function () {
            state.errors.name = '';

            let isValid = true;

            if (!state.name) {
                state.errors.name = 'Name is required.';
                isValid = false;
            }

            return isValid;
        };

        const handler = {
            handleSubmit: async function () {
                try {
                    state.isSubmitting = true;
                    await new Promise(resolve => setTimeout(resolve, 300));

                    if (!validateForm()) {
                        return;
                    }

                    const response = state.id === ''
                        ? await services.createMainData(state.name, state.description, StorageManager.getUserId())
                        : state.deleteMode
                            ? await services.deleteMainData(state.id, StorageManager.getUserId())
                            : await services.updateMainData(state.id, state.name, state.description, StorageManager.getUserId());

                    if (response.data.code === 200) {
                        await methods.populateMainData();
                        mainGrid.refresh();
                        Swal.fire({
                            icon: 'success',
                            title: state.deleteMode ? 'Delete Successful' : 'Save Successful',
                            text: 'Form will be closed...',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        setTimeout(() => {
                            mainModal.obj.hide();
                        }, 2000);
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: state.deleteMode ? 'Delete Failed' : 'Save Failed',
                            text: response.data.message ?? 'Please check your data.',
                            confirmButtonText: 'Try Again'
                        });
                    }

                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'An Error Occurred',
                        text: error.response?.data?.message ?? 'Please try again.',
                        confirmButtonText: 'OK'
                    });
                } finally {
                    state.isSubmitting = false;
                }
            },
        };

        Vue.watch(
            () => state.name,
            (newVal, oldVal) => {
                state.errors.name = '';
                nameText.refresh();
            }
        );

        Vue.onMounted(async () => {
            try {
                await SecurityManager.authorizePage(['SalesTeams']);
                await SecurityManager.validateToken();
                await methods.populateMainData();
                await mainGrid.create(state.mainData);
                nameText.create();
                mainModal.create();
                mainModalRef.value?.addEventListener('hidden.bs.modal', methods.onMainModalHidden);
            } catch (e) {
                console.error('page init error:', e);
            } finally {
                hideSpinnerAndShowContent();
            }
        });

        Vue.onUnmounted(() => {
            mainModalRef.value?.removeEventListener('hidden.bs.modal', methods.onMainModalHidden);
        });

        return {
            mainGridRef,
            mainModalRef,
            nameRef,
            state,
            handler,
        };
    }
};

Vue.createApp(App).mount('#app');