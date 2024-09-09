from rest_framework import views, permissions, response, request
from ..users import services as users_services
from . import services as datasets_services
from .serializers import  DatasetsSerializer, LabelsSerializer

class Datasets(views.APIView):
    '''
    A class-based view to handle the datasets by category endpoints
    
    ...

    Attributes
    ----------
    authentication_classes : tuple
        a tuple of authentication classes
    permission_classes : tuple
        a tuple of permission classes
    
    Methods
    -------
    get(request, category_id)
        Get the datasets list of a given category
    '''    
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request: request.Request, category_id: str) -> response.Response:
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            datasets = datasets_services.get_datasets(category_id)
            datasets = DatasetsSerializer(datasets, many=True).data
            return response.Response(datasets, status=200)


class Dataset(views.APIView):
    '''
    A class-based view to handle the dataset endpoints by id (CRUD operations)
    
    ...
    
    Attributes
    ----------
    authentication_classes : tuple
        a tuple of authentication classes
    permission_classes : tuple
        a tuple of permission classes
    
    Methods
    -------
    get(request, dataset_id) -> response.Response
        Get a dataset by its id
        
    post(request) -> response.Response
        Create a new dataset
        
    patch(request, dataset_id) -> response.Response
        Update specific fields of existing dataset by id
        
    delete(request, dataset_id) -> response.Response
        Delete a dataset by id
    '''
    
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request: request.Request, dataset_id: str) -> response.Response:
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            dataset = datasets_services.get_dataset(dataset_id)
            dataset = DatasetsSerializer(dataset).data
            return response.Response(dataset, status=200)
    
    def post(self, request: request.Request) -> response.Response:
        serialized_data = DatasetsSerializer(data=request.data)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            serialized_data.instance = datasets_services.create_dataset(validated_data)
            return response.Response(serialized_data.data, status=200)
        else:
            return response.Response(serialized_data.errors, status=400)
    
    def patch(self, request: request.Request, dataset_id: str) -> response.Response:
        if not dataset_id:
            return response.Response(data={"error": "Id is required"}, status=400)
        
        serialized_data = DatasetsSerializer(data=request.data, partial=True)
        if serialized_data.is_valid():
            serialized_data = serialized_data.validated_data
            updated_data = datasets_services.update_dataset(dataset_id, serialized_data)
            serialized_data = DatasetsSerializer(updated_data)
            return response.Response(serialized_data.data, status=200)
        return response.Response(serialized_data.errors, status=400)
    
    def delete(self, request: request.Request, dataset_id: str) -> response.Response:
        if not dataset_id:
            return response.Response(data={"error": "Id is required"}, status=400)
        try:
            datasets_services.delete_dataset(dataset_id)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        return response.Response(status=200, data={"message": "Dataset deleted successfully"})

class Label(views.APIView):
    '''
    A class-based view to handle the label endpoints by id (CRUD operations)
    
    ...
    
    Attributes
    ----------
    authentication_classes : tuple
        a tuple of authentication classes
    permission_classes : tuple
        a tuple of permission classes
    
    Methods
    -------
    get(request, label_id) -> response.Response
        Get a label by its id
    
    post(request) -> response.Response
        Create a new label
    
    patch(request, label_id) -> response.Response
        Update specific fields of existing label by id
    
    delete(request, label_id) -> response.Response
        Delete a label by id
    '''
    
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request: request.Request, label_id: str) -> response.Response:
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            label = datasets_services.get_label(label_id, request.user)
            label = LabelsSerializer(label).data
            return response.Response(label, status=200)
    
    def post(self, request: request.Request,dataset_id: str) -> response.Response:
        serialized_data = LabelsSerializer(data=request.data)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            dataset = datasets_services.create_label(dataset_id, validated_data)
            serialized_data.instance = dataset
            return response.Response(serialized_data.data, status=200)
        else:
            return response.Response(serialized_data.errors, status=400)
    
    def patch(self, request: request.Request, label_id: str) -> response.Response:
        if not label_id:
            return response.Response(data={"error": "Id is required"}, status=400)
        
        serialized_data = LabelsSerializer(data=request.data, partial=True)
        if serialized_data.is_valid():
            serialized_data = serialized_data.validated_data
            updated_data = datasets_services.update_label(label_id, serialized_data, request.user)
            serialized_data = LabelsSerializer(updated_data)
            return response.Response(serialized_data.data, status=200)
        return response.Response(serialized_data.errors, status=400)
    
    def delete(self, request: request.Request, label_id: str) -> response.Response:
        if not label_id:
            return response.Response(data={"error": "Id is required"}, status=400)
        try:
            # get dataset id from body
            dataset_id = request.data.get('dataset_id')
            datasets_services.delete_label(dataset_id, label_id)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        return response.Response(status=200, data={"message": "Label deleted successfully"})
    
class Labels(views.APIView):
    '''
    A class-based view to handle the labels of a dataset
    
    ...
    
    Attributes
    ----------
    authentication_classes : tuple
        a tuple of authentication classes
    permission_classes : tuple
        a tuple of permission classes
    
    Methods
    -------
    get(request, dataset_id) -> response.Response
        Get the labels of a dataset
    '''
    
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request: request.Request, dataset_id: str) -> response.Response:
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            labels = datasets_services.get_labels(dataset_id)
            labels = LabelsSerializer(labels, many=True).data
            return response.Response(labels, status=200)