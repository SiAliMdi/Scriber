dir=$(dirname "$(pwd)")
source "$dir"/local.env

CUDA_VISIBLE_DEVICES=0 vllm serve $MISTRAL_MODEL \
                                --tokenizer_mode mistral \
                                --config_format mistral \
                                --load_format mistral \
                                --dtype float16 \
                                --max-model-len 32768 \
                                --pipeline-parallel-size 1 \
                                --gpu-memory-utilization 0.96 \
                                --served-model-name $MISTRAL_TAG \
                                --use-v2-block-manager \
                                --max-log-len 50 \
                                --max-num-seqs 16 \
                                --host $DB_HOST \
                                --port $MISTRAL_PORT \
                                --seed 123 \
                                --api-key $LLM_API_KEY \
                                --download-dir "$LLMS_DIR_PATH"/"$MISTRAL_MODEL" \
                                1> $dir/logs/llms/mistral/serve_mistral.log \
                                2> $dir/logs/llms/mistral/serve_mistral.err
                                
