dir=$(dirname "$(pwd)")
source "$dir"/local.env

docker run -p $TYPESENSE_PORT:$TYPESENSE_IN_PORT \
            -v "$dir"/typesense_data:/data typesense/"$TYPESENSE_IMAGE" \
            --host $TYPESENSE_HOST \
            --data-dir /data \
            --api-key=$TYPESENSE_API_KEY \
            --enable-cors \
            --filter-by-max-ops 500\
            --max-per-page 1000 \
            > "$dir"/logs/typesense/out.log \
            2> "$dir"/logs/typesense/error.err 

