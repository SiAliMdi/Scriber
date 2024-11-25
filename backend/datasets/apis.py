from uuid import UUID
from rest_framework import views, permissions, response, request

from categories.models import CategoriesModel

from .models import DatasetsModel, Labels as LabelsModel, DatasetsLabelsModel
from users import services as users_services
from . import services as datasets_services
from .serializers import  DatasetsSerializer, LabelsSerializer
from categories.serializers import CategoriesSerializer
from users.serializers import UserSerializer

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
            # datasets = datasets_services.get_datasets(category_id)
            datasets = DatasetsModel.objects.filter(categorie=UUID(category_id).hex, deleted=False)
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
            validated_data['creator'] = request.user                
            validated_data['categorie'] = CategoriesModel.objects.get(id=validated_data['categorie'])
            dataset = DatasetsModel.objects.create(**validated_data)
            dataset = DatasetsSerializer(dataset)
            return response.Response(dataset.data, status=200)
        else:
            return response.Response(serialized_data.errors, status=400)
    
    def patch(self, request: request.Request, dataset_id: str) -> response.Response:
        if not dataset_id:
            return response.Response(data={"error": "Id is required"}, status=400)
        dataset = DatasetsModel.objects.get(id=dataset_id)
        serializer = DatasetsSerializer(data=request.data, partial=True, instance=dataset)
        if serializer.is_valid():
            serialized_data = serializer.validated_data
            serializer.update(instance=DatasetsModel.objects.get(id=dataset_id), validated_data=serialized_data, updater=request.user)
            serialized_data['categorie'] = CategoriesSerializer(serialized_data['categorie']).data
            serialized_data['creator'] = UserSerializer(serialized_data['creator']).data
            return response.Response(data=serialized_data, status=200)
        return response.Response(serialized_data.errors, status=400)
    
    def delete(self, request: request.Request, dataset_id: str) -> response.Response:
        if not dataset_id:
            return response.Response(data={"error": "Id is required"}, status=400)
        try:
            dataset = DatasetsModel.objects.get(id=dataset_id)
            dataset.deleted = True
            for ds in DatasetsModel.objects.filter(deleted=False, serial_number__gt=dataset.serial_number):
                ds.serial_number -= 1
                ds.save()
            dataset.serial_number = 0
            dataset.save()
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
    
    def post(self, request: request.Request, dataset_id: str) -> response.Response:
        if not dataset_id:
            return response.Response(data={"error": "Dataset id is required"}, status=400)
        serialized_data = LabelsSerializer(data=request.data)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            validated_data['creator'] = request.user                
            dataset = LabelsModel.objects.create(**validated_data)
            Dataset = DatasetsModel.objects.get(id=dataset_id)
            Dataset.labels.add(dataset)
            Dataset.save()
            dataset = LabelsSerializer(dataset)
            return response.Response(dataset.data, status=200)
        else:
            return response.Response(serialized_data.errors, status=400)
    
    def patch(self, request: request.Request, label_id: str) -> response.Response:
        if not label_id:
            return response.Response(data={"error": "Id is required"}, status=400)
        label = LabelsModel.objects.get(id=label_id)
        serializer = LabelsSerializer(data=request.data, partial=True, instance=label)
        if serializer.is_valid():
            serialized_data = serializer.validated_data
            serializer.update(instance=label, validated_data=serialized_data, updater=request.user)
            serialized_data['creator'] = UserSerializer(serialized_data['creator']).data
            return response.Response(data=serialized_data, status=200)
        return response.Response(serialized_data.errors, status=400)
    
    def delete(self, request: request.Request, label_id: str) -> response.Response:
        if not label_id:
            return response.Response(data={"error": "Id is required"}, status=400)
        try:
            label = LabelsModel.objects.get(id=label_id)
            label.deleted = True
            label.save()
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
            # labels = datasets_services.get_labels(dataset_id)
            labels = DatasetsModel.objects.get(pk=UUID(dataset_id).hex).labels.filter(deleted=False)
            labels = LabelsSerializer(labels, many=True).data
            """ dataset_labels = DatasetsLabelsModel.objects.filter(
                dataset_id=UUID(dataset_id).hex,
                label__deleted=False
            ).select_related('label')
            labels = [dataset_label.label for dataset_label in dataset_labels]
            labels = LabelsSerializer(labels, many=True).data """
            return response.Response(labels, status=200)