dir=$(dirname "$(pwd)")
source "$dir"/local.env

CUDA_VISIBLE_DEVICES=1 vllm serve $LLAMA_MODEL \
                                --dtype float16 \
                                --max-model-len 32768 \
                                --pipeline-parallel-size 1 \
                                --gpu-memory-utilization 0.99 \
                                --served-model-name $LLAMA_TAG \
                                --use-v2-block-manager \
                                --max-log-len 50 \
                                --max-num-seqs 16 \
                                --host $DB_HOST \
                                --port $LLAMA_PORT \
                                --seed 123 \
                                --api-key $LLM_API_KEY \
                                --download-dir "$LLMS_DIR_PATH"/"$LLAMA_MODEL" \
                                1> $dir/logs/llms/llama/serve_llama.log \
                                2> $dir/logs/llms/llama/serve_llama.err
                                
